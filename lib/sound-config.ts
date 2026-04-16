/**
 * 内置通知音效配置
 * 提供 7 种不同的通知音效，可按优先级或用户偏好选择
 */

export type SoundId = 
  | "default"
  | "chime"
  | "bell"
  | "ding"
  | "ping"
  | "pop"
  | "alert"
  | "zen"
  | "dawn"
  | "crystal";

export interface SoundOption {
  id: SoundId;
  name: string;
  description: string;
  fileName: string;
  duration: number; // 毫秒
  category: "basic" | "premium";
}

export const SOUND_OPTIONS: Record<SoundId, SoundOption> = {
  default: {
    id: "default",
    name: "默认提醒",
    description: "柔和的系统默认提醒音",
    fileName: "default.mp3",
    duration: 1000,
    category: "basic",
  },
  chime: {
    id: "chime",
    name: "风铃",
    description: "清脆的风铃声，适合高优先级任务",
    fileName: "chime.mp3",
    duration: 1200,
    category: "basic",
  },
  bell: {
    id: "bell",
    name: "铃铛",
    description: "传统的铃铛声，醒目且不刺耳",
    fileName: "bell.mp3",
    duration: 1500,
    category: "basic",
  },
  ding: {
    id: "ding",
    name: "叮",
    description: "简洁的叮一声，轻快有力",
    fileName: "ding.mp3",
    duration: 800,
    category: "basic",
  },
  ping: {
    id: "ping",
    name: "乒",
    description: "电子感十足的乒声，现代感强",
    fileName: "ping.mp3",
    duration: 600,
    category: "basic",
  },
  pop: {
    id: "pop",
    name: "砰",
    description: "轻快的砰声，充满趣味",
    fileName: "pop.mp3",
    duration: 700,
    category: "basic",
  },
  alert: {
    id: "alert",
    name: "警报",
    description: "明显的警报声，适合紧急提醒",
    fileName: "alert.mp3",
    duration: 2000,
    category: "basic",
  },
  zen: {
    id: "zen",
    name: "禅意黎明",
    description: "如晨钟般深远悠长，极具沉浸感",
    fileName: "zen.mp3",
    duration: 3000,
    category: "premium",
  },
  dawn: {
    id: "dawn",
    name: "森之静谧",
    description: "森林清晨的鸟鸣与空气感",
    fileName: "dawn.mp3",
    duration: 2500,
    category: "premium",
  },
  crystal: {
    id: "crystal",
    name: "水晶竖琴",
    description: "如露水般纯净的竖琴拨弦声",
    fileName: "crystal.mp3",
    duration: 1800,
    category: "premium",
  },
};

/**
 * 根据优先级推荐音效
 */
export function getRecommendedSoundForPriority(priority: "low" | "medium" | "high"): SoundId {
  switch (priority) {
    case "low":
      return "ding"; // 柔和
    case "medium":
      return "chime"; // 中等
    case "high":
      return "alert"; // 醒目
    default:
      return "default";
  }
}

/**
 * 获取音效的完整路径
 */
export function getSoundPath(soundId: SoundId): string {
  const option = SOUND_OPTIONS[soundId];
  if (!option) return "";
  return `${require.resolve("../assets/sounds")}/${option.fileName}`;
}

/**
 * 验证音效 ID 是否有效
 */
export function isValidSoundId(soundId: unknown): soundId is SoundId {
  return typeof soundId === "string" && soundId in SOUND_OPTIONS;
}
