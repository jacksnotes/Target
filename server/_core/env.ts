export const ENV = {
  forgeApiUrl:
    process.env.NEW_API_URL ||
    process.env.EXPO_PUBLIC_BUILT_IN_FORGE_API_URL ||
    process.env.BUILT_IN_FORGE_API_URL ||
    "",
  forgeApiKey:
    process.env.NEW_API_TOKEN ||
    process.env.EXPO_PUBLIC_BUILT_IN_FORGE_API_KEY ||
    process.env.BUILT_IN_FORGE_API_KEY ||
    "",
  llmModel: process.env.LLM_MODEL || "minimax/minimax-m2.7",
};