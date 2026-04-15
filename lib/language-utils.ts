/**
 * Maps common Chinese language names to their corresponding BCP 47 language tags
 * for use with Expo Speech (TTS).
 */
export const getLanguageTag = (name: string): string => {
  const normalized = name.toLowerCase();
  
  if (normalized.includes("法")) return "fr-FR";
  if (normalized.includes("英")) return "en-US";
  if (normalized.includes("日")) return "ja-JP";
  if (normalized.includes("德")) return "de-DE";
  if (normalized.includes("西")) return "es-ES";
  if (normalized.includes("韩") || normalized.includes("朝鲜")) return "ko-KR";
  if (normalized.includes("意")) return "it-IT";
  if (normalized.includes("俄")) return "ru-RU";
  if (normalized.includes("中") || normalized.includes("汉")) return "zh-CN";
  if (normalized.includes("葡")) return "pt-PT";
  
  // Default to English if no match found
  return "en-US";
};

/**
 * Extracts the language from a goal or task title.
 * Example: "翻译官计划 · 法语" -> "法语"
 */
export const extractLanguageFromTitle = (title: string): string => {
  if (title.includes("·")) {
    return title.split("·")[1].trim();
  }
  return title;
};
