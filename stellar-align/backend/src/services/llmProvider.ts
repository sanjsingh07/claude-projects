import axios from "axios";
import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env";
import logger from "../config/logger";

// ────────────────────────────────────────────
// Unified LLM interface — switchable via AI_PROVIDER env
// ────────────────────────────────────────────

export interface LLMMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface LLMResponse {
  text: string;
  usage?: { inputTokens: number; outputTokens: number };
}

export interface LLMProvider {
  name: string;
  isAvailable: boolean;
  complete(messages: LLMMessage[], opts?: LLMOptions): Promise<LLMResponse>;
}

export interface LLMOptions {
  maxTokens?: number;
  temperature?: number;
}

// ────────────────────────────────────────────
// Anthropic provider
// ────────────────────────────────────────────

class AnthropicProvider implements LLMProvider {
  name = "anthropic";
  isAvailable: boolean;
  private client: Anthropic | null = null;
  private model: string;

  constructor() {
    this.isAvailable = !!env.ANTHROPIC_API_KEY;
    this.model = env.ANTHROPIC_MODEL;
    if (this.isAvailable) {
      this.client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    }
  }

  async complete(
    messages: LLMMessage[],
    opts?: LLMOptions,
  ): Promise<LLMResponse> {
    if (!this.client) throw new Error("Anthropic client not initialized");

    // Anthropic uses a separate `system` param instead of a system message
    const systemMsg = messages.find((m) => m.role === "system");
    const chatMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: opts?.maxTokens ?? 2000,
      ...(systemMsg && { system: systemMsg.content }),
      messages: chatMessages,
    });

    const text = response.content.find((b) => b.type === "text");
    return {
      text: text && "text" in text ? text.text : "",
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }
}

// ────────────────────────────────────────────
// NVIDIA NIM provider (OpenAI-compatible API)
// ────────────────────────────────────────────

class NvidiaProvider implements LLMProvider {
  name = "nvidia";
  isAvailable: boolean;
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = env.NVIDIA_API_KEY || "";
    this.model = env.NVIDIA_MODEL;
    this.baseUrl = env.NVIDIA_BASE_URL;
    this.isAvailable = !!this.apiKey;
  }

  async complete(
    messages: LLMMessage[],
    opts?: LLMOptions,
  ): Promise<LLMResponse> {
    if (!this.isAvailable) throw new Error("NVIDIA API key not configured");

    logger.info("NVIDIA LLM request", {
      model: this.model,
      messageCount: messages.length,
      maxTokens: opts?.maxTokens ?? 2000,
    });

    logger.info("NVIDIA LLM messages", { messages });

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          max_tokens: opts?.maxTokens ?? 500,
          temperature: opts?.temperature ?? 0.6,
          top_p: 0.95,
          stream: false,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 30_000, // Reduced timeout
        },
      );

      const choice = response.data?.choices?.[0];
      const text: string = choice?.message?.content ?? "";

      logger.info("NVIDIA LLM response", {
        textLength: text?.length ?? 0,
        truncatedText: text?.substring(0, 100) + "...",
      });

      // Strip <think>...</think> blocks that reasoning models emit
      const cleaned = text?.replace(/<think>[\s\S]*?<\/think>/g, "").trim() || "No response";

      return {
        text: cleaned,
        usage: {
          inputTokens: response.data?.usage?.prompt_tokens ?? 0,
          outputTokens: response.data?.usage?.completion_tokens ?? 0,
        },
      };
    } catch (error: any) {
      logger.error("NVIDIA LLM error", {
        error: error.message,
        code: error.code,
        status: error.response?.status,
      });
      throw error;
    }
  }
}

// ────────────────────────────────────────────
// Resolver — picks the configured provider, falls back gracefully
// ────────────────────────────────────────────

const providers: LLMProvider[] = [
  new AnthropicProvider(),
  new NvidiaProvider(),
];

export function getLLMProvider(): LLMProvider {
  const preferred = env.AI_PROVIDER;
  const provider = providers.find((p) => p.name === preferred && p.isAvailable);

  if (provider) {
    logger.info(`LLM provider: ${provider.name}`);
    return provider;
  }

  // Fall back to whichever is available
  const fallback = providers.find((p) => p.isAvailable);
  if (fallback) {
    logger.warn(
      `Preferred provider "${preferred}" unavailable — falling back to ${fallback.name}`,
    );
    return fallback;
  }

  logger.warn(
    "No LLM provider configured — AI features will use rule-based fallbacks",
  );
  return {
    name: "none",
    isAvailable: false,
    async complete() {
      throw new Error("No LLM provider available");
    },
  };
}

export const llmProvider = getLLMProvider();
export default llmProvider;
