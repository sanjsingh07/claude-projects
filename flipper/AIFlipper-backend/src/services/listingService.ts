export interface ListingResult {
  title: string;
  description: string;
  suggestedTags: string[];
}

export const generateListing = async (productName: string, category: string, condition: string): Promise<ListingResult> => {
  // Prototype templates for copy generation.
  // In production, this can invoke an LLM API.
  const title = `🔥 [HOT DEALS] ${productName} - ${condition} Condition`;
  
  let description = `🚀 **Upgrade your gear today!** Up for grabs is a premium **${productName}** in **${condition}** condition.\n\n`;
  description += `✨ **Key Highlights:**\n`;
  description += `- 📸 Condition: Evaluated as ${condition} via FlipAI Smart Scan.\n`;
  description += `- 💎 Authenticity: 100% Guaranteed authentic item.\n`;
  description += `- 📦 Shipping: Professionally packaged and shipped fast via flat-rate standard preset.\n\n`;
  description += `⚠️ *Listing is limited and priced to sell quickly based on real-time comps. Buy now before it's gone!*`;

  const tags = [
    productName.split(' ')[0].toLowerCase(),
    category.toLowerCase(),
    condition.replace(' ', '').toLowerCase(),
    'reseller',
    'deals'
  ].filter(t => t.length > 0);

  // Return a generated response (could simulate api latency)
  await new Promise(resolve => setTimeout(resolve, 800));

  return {
    title,
    description,
    suggestedTags: tags
  };
};
