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
  purpose?: "horoscope" | "chat";
  mappingId?: string;
}

/**
 * Selects an API key from an array based on the purpose and mappingId.
 * Random for horoscope, mapped for chat.
 */
function selectApiKey(keys: string[], purpose?: string, mappingId?: string): string {
  if (!keys || keys.length === 0) return "";
  if (keys.length === 1) return keys[0];

  if (purpose === "horoscope") {
    return keys[Math.floor(Math.random() * keys.length)];
  }

  if (purpose === "chat" && mappingId) {
    let hash = 0;
    for (let i = 0; i < mappingId.length; i++) {
      hash = (hash << 5) - hash + mappingId.charCodeAt(i);
      hash |= 0;
    }
    return keys[Math.abs(hash) % keys.length];
  }

  return keys[0];
}

function maskKey(key: string): string {
  if (!key) return "none";
  if (key.length <= 8) return "****";
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
}

// ────────────────────────────────────────────
// Anthropic provider
// ────────────────────────────────────────────

class AnthropicProvider implements LLMProvider {
  name = "anthropic";
  isAvailable: boolean;
  private apiKeys: string[];
  private model: string;

  constructor() {
    this.apiKeys = env.ANTHROPIC_API_KEY;
    this.model = env.ANTHROPIC_MODEL;
    this.isAvailable = this.apiKeys.length > 0;
  }

  async complete(
    messages: LLMMessage[],
    opts?: LLMOptions,
  ): Promise<LLMResponse> {
    const apiKey = selectApiKey(this.apiKeys, opts?.purpose, opts?.mappingId);
    if (!apiKey) throw new Error("Anthropic API key not configured");

    const start = Date.now();
    try {
      const client = new Anthropic({ apiKey });

      // Anthropic uses a separate `system` param instead of a system message
      const systemMsg = messages.find((m) => m.role === "system");
      const chatMessages = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      const response = await client.messages.create({
        model: this.model,
        max_tokens: opts?.maxTokens ?? 4000,
        ...(systemMsg && { system: systemMsg.content }),
        messages: chatMessages,
      });

      const text = response.content.find((b) => b.type === "text");
      const duration = Date.now() - start;

      logger.info(`Anthropic LLM success`, {
        duration,
        model: this.model,
        key: maskKey(apiKey),
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      });

      return {
        text: text && "text" in text ? text.text : "",
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      };
    } catch (error: any) {
      const duration = Date.now() - start;
      logger.error(`Anthropic LLM error`, {
        duration,
        key: maskKey(apiKey),
        error: error.message,
        status: error.status,
      });
      throw error;
    }
  }
}

// ────────────────────────────────────────────
// NVIDIA NIM provider (OpenAI-compatible API)
// ────────────────────────────────────────────

class NvidiaProvider implements LLMProvider {
  name = "nvidia";
  isAvailable: boolean;
  private apiKeys: string[];
  private model: string;
  private baseUrl: string;

  constructor() {
    this.apiKeys = env.NVIDIA_API_KEY;
    this.model = env.NVIDIA_MODEL;
    this.baseUrl = env.NVIDIA_BASE_URL;
    this.isAvailable = this.apiKeys.length > 0;
  }

  async complete(
    messages: LLMMessage[],
    opts?: LLMOptions,
  ): Promise<LLMResponse> {
    const apiKey = selectApiKey(this.apiKeys, opts?.purpose, opts?.mappingId);
    if (!apiKey) throw new Error("NVIDIA API key not configured");

    const start = Date.now();
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          max_tokens: opts?.maxTokens ?? 4000,
          temperature: opts?.temperature ?? 0.6,
          top_p: 0.95,
          stream: false,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 30_000,
        },
      );

      const choice = response.data?.choices?.[0];
      const text: string = choice?.message?.content ?? "";
      const cleaned = text?.replace(/<think>[\s\S]*?<\/think>/g, "").trim() || "No response";
      const duration = Date.now() - start;

      logger.info(`NVIDIA LLM success`, {
        duration,
        model: this.model,
        key: maskKey(apiKey),
        inputTokens: response.data?.usage?.prompt_tokens,
        outputTokens: response.data?.usage?.completion_tokens,
      });

      return {
        text: cleaned,
        usage: {
          inputTokens: response.data?.usage?.prompt_tokens ?? 0,
          outputTokens: response.data?.usage?.completion_tokens ?? 0,
        },
      };
    } catch (error: any) {
      const duration = Date.now() - start;
      logger.error("NVIDIA LLM error", {
        duration,
        key: maskKey(apiKey),
        error: error.message,
        code: error.code,
        status: error.response?.status,
      });
      throw error;
    }
  }
}

// ────────────────────────────────────────────
// Gemini provider
// ────────────────────────────────────────────

class GeminiProvider implements LLMProvider {
  name = "gemini";
  isAvailable: boolean;
  private apiKeys: string[];
  private model: string;

  constructor() {
    this.apiKeys = env.GEMINI_API_KEY;
    this.model = env.GEMINI_MODEL;
    this.isAvailable = this.apiKeys.length > 0;
  }

  async complete(
    messages: LLMMessage[],
    opts?: LLMOptions,
  ): Promise<LLMResponse> {
    const apiKey = selectApiKey(this.apiKeys, opts?.purpose, opts?.mappingId);
    if (!apiKey) throw new Error("Gemini API key not configured");

    const start = Date.now();
    const config = {
      maxOutputTokens: opts?.maxTokens ?? 4000,
      temperature: opts?.temperature ?? 0.6,
      responseMimeType: opts?.purpose === "chat" ? "text/plain" : "application/json",
    };

    try {
      logger.debug("Gemini request payload", {
        model: this.model,
        config,
        messagesCount: messages.length,
      });

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${apiKey}`,
        {
          contents: messages.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
          generationConfig: config,
        },
        { timeout: 30_000 },
      );

      const candidate = response.data?.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text ?? "";
      const finishReason = candidate?.finishReason;
      const duration = Date.now() - start;

      logger.info(`Gemini LLM success`, {
        duration,
        model: this.model,
        key: maskKey(apiKey),
        finishReason,
      });

      if (finishReason && finishReason !== "STOP") {
        logger.warn(`Gemini finished with reason: ${finishReason}`, {
          textLength: text.length,
          preview: text.substring(text.length - 100)
        });
      }

      return { text };
    } catch (error: any) {
      const duration = Date.now() - start;
      logger.error("Gemini LLM error", {
        duration,
        key: maskKey(apiKey),
        error: error.message,
        status: error.response?.status,
      });
      throw error;
    }
  }
}

// ────────────────────────────────────────────
// Groq provider (OpenAI-compatible)
// ────────────────────────────────────────────

class GroqProvider implements LLMProvider {
  name = "groq";
  isAvailable: boolean;
  private apiKeys: string[];
  private model: string;

  constructor() {
    this.apiKeys = env.GROQ_API_KEY;
    this.model = env.GROQ_MODEL;
    this.isAvailable = this.apiKeys.length > 0;
  }

  async complete(
    messages: LLMMessage[],
    opts?: LLMOptions,
  ): Promise<LLMResponse> {
    const apiKey = selectApiKey(this.apiKeys, opts?.purpose, opts?.mappingId);
    if (!apiKey) throw new Error("Groq API key not configured");

    const start = Date.now();
    try {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: this.model,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          max_tokens: opts?.maxTokens ?? 4000,
          temperature: opts?.temperature ?? 0.6,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 20_000,
        },
      );

      const text = response.data?.choices?.[0]?.message?.content ?? "";
      const duration = Date.now() - start;

      logger.info(`Groq LLM success`, {
        duration,
        model: this.model,
        key: maskKey(apiKey),
        inputTokens: response.data?.usage?.prompt_tokens,
        outputTokens: response.data?.usage?.completion_tokens,
      });

      return { text };
    } catch (error: any) {
      const duration = Date.now() - start;
      logger.error("Groq LLM error", {
        duration,
        key: maskKey(apiKey),
        error: error.message,
        status: error.response?.status,
      });
      throw error;
    }
  }
}

// ────────────────────────────────────────────
// Opencode provider (Anthropic-compatible API)
// ────────────────────────────────────────────

class OpencodeProvider implements LLMProvider {
  name = "opencode";
  isAvailable: boolean;
  private apiKeys: string[];
  private model: string;
  private baseUrl: string;

  constructor() {
    this.apiKeys = env.OPENCODE_API_KEY;
    this.model = env.OPENCODE_MODEL;
    this.baseUrl = env.OPENCODE_BASE_URL;
    this.isAvailable = this.apiKeys.length > 0;
  }

  async complete(
    messages: LLMMessage[],
    opts?: LLMOptions,
  ): Promise<LLMResponse> {
    const apiKey = selectApiKey(this.apiKeys, opts?.purpose, opts?.mappingId);
    if (!apiKey) throw new Error("Opencode API key not configured");

    const start = Date.now();
    try {
      const systemMsg = messages.find((m) => m.role === "system");
      const chatMessages = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      const response = await axios.post(
        `${this.baseUrl}/messages`,
        {
          model: this.model,
          messages: chatMessages,
          max_tokens: opts?.maxTokens ?? 4096,
          temperature: opts?.temperature ?? 0.6,
          ...(systemMsg && { system: systemMsg.content }),
          stream: false,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "x-opencode-client": "desktop",
            "anthropic-version": "2023-06-01",
          },
          timeout: 45_000,
        },
      );

      const text = response.data?.content?.find((b: any) => b.type === "text")?.text ?? "";
      const duration = Date.now() - start;

      logger.info(`Opencode LLM success`, {
        duration,
        model: this.model,
        key: maskKey(apiKey),
        inputTokens: response.data?.usage?.input_tokens,
        outputTokens: response.data?.usage?.output_tokens,
      });
      
      return {
        text,
        usage: {
          inputTokens: response.data?.usage?.input_tokens ?? 0,
          outputTokens: response.data?.usage?.output_tokens ?? 0,
        },
      };
    } catch (error: any) {
      const duration = Date.now() - start;
      logger.error("Opencode LLM error", {
        duration,
        key: maskKey(apiKey),
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  }
}

// ────────────────────────────────────────────
// OpenRouter provider (OpenAI-compatible)
// ────────────────────────────────────────────

class OpenRouterProvider implements LLMProvider {
  name = "openrouter";
  isAvailable: boolean;
  private apiKeys: string[];
  private model: string;
  private baseUrl: string;

  constructor() {
    this.apiKeys = env.OPENROUTER_API_KEY;
    this.model = env.OPENROUTER_MODEL;
    this.baseUrl = env.OPENROUTER_BASE_URL;
    this.isAvailable = this.apiKeys.length > 0;
  }

  async complete(
    messages: LLMMessage[],
    opts?: LLMOptions,
  ): Promise<LLMResponse> {
    const apiKey = selectApiKey(this.apiKeys, opts?.purpose, opts?.mappingId);
    if (!apiKey) throw new Error("OpenRouter API key not configured");

    const start = Date.now();
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          max_tokens: opts?.maxTokens ?? 4000,
          temperature: opts?.temperature ?? 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 45_000,
        },
      );

      const text = response.data?.choices?.[0]?.message?.content ?? "";
      const duration = Date.now() - start;

      logger.info(`OpenRouter LLM success`, {
        duration,
        model: this.model,
        key: maskKey(apiKey),
        inputTokens: response.data?.usage?.prompt_tokens,
        outputTokens: response.data?.usage?.completion_tokens,
      });

      return {
        text,
        usage: {
          inputTokens: response.data?.usage?.prompt_tokens ?? 0,
          outputTokens: response.data?.usage?.completion_tokens ?? 0,
        },
      };
    } catch (error: any) {
      const duration = Date.now() - start;
      logger.error("OpenRouter LLM error", {
        duration,
        key: maskKey(apiKey),
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  }
}

// ────────────────────────────────────────────
// Resolver & Multi-Provider Wrapper
// ────────────────────────────────────────────

const availableProviders: LLMProvider[] = [
  new AnthropicProvider(),
  new NvidiaProvider(),
  new GeminiProvider(),
  new GroqProvider(),
  new OpencodeProvider(),
  new OpenRouterProvider(),
].filter((p) => p.isAvailable);

class ResilientLLMProvider implements LLMProvider {
  name = "resilient-wrapper";
  
  get isAvailable() {
    return availableProviders.length > 0;
  }

  async complete(
    messages: LLMMessage[],
    opts?: LLMOptions,
  ): Promise<LLMResponse> {
    const preferredName = env.AI_PROVIDER;
    const sorted = [...availableProviders].sort((a, b) => {
      if (a.name === preferredName) return -1;
      if (b.name === preferredName) return 1;
      return 0;
    });

    if (sorted.length === 0) {
      logger.error("No LLM providers available", { 
        env_provider: preferredName, 
        available: availableProviders.map(p => p.name) 
      });
      throw new Error("No LLM providers available");
    }

    logger.info("LLM Provider Rotation", {
      purpose: opts?.purpose,
      mappingId: opts?.mappingId,
      preferred: preferredName,
      available_count: availableProviders.length,
      rotation: sorted.map(p => p.name)
    });

    let lastError: Error | null = null;

    for (const provider of sorted) {
      const start = Date.now();
      try {
        logger.info(`Attempting LLM completion`, { provider: provider.name, purpose: opts?.purpose });
        const response = await provider.complete(messages, opts);
        
        if (!response.text || response.text === "No response") {
          throw new Error(`Provider ${provider.name} returned empty or invalid response`);
        }
        
        return response;
      } catch (error: any) {
        const duration = Date.now() - start;
        logger.warn(`LLM provider ${provider.name} failed`, {
          duration,
          error: error.message,
          purpose: opts?.purpose,
        });
        lastError = error;
      }
    }

    throw lastError || new Error("All LLM providers failed");
  }
}

export const llmProvider = new ResilientLLMProvider();
export default llmProvider;

