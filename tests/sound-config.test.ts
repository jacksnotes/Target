import { describe, it, expect } from "vitest";
import {
  SOUND_OPTIONS,
  SoundId,
  getRecommendedSoundForPriority,
  isValidSoundId,
} from "../lib/sound-config";

describe("Sound Configuration", () => {
  it("should have all required sound options", () => {
    const soundIds: SoundId[] = [
      "default",
      "chime",
      "bell",
      "ding",
      "ping",
      "pop",
      "alert",
    ];

    soundIds.forEach((id) => {
      expect(SOUND_OPTIONS[id]).toBeDefined();
      expect(SOUND_OPTIONS[id].id).toBe(id);
      expect(SOUND_OPTIONS[id].name).toBeDefined();
      expect(SOUND_OPTIONS[id].description).toBeDefined();
      expect(SOUND_OPTIONS[id].fileName).toBeDefined();
      expect(SOUND_OPTIONS[id].duration).toBeGreaterThan(0);
      expect(["soft", "medium", "loud"]).toContain(SOUND_OPTIONS[id].category);
    });
  });

  it("should validate sound option properties", () => {
    Object.values(SOUND_OPTIONS).forEach((option) => {
      expect(typeof option.id).toBe("string");
      expect(typeof option.name).toBe("string");
      expect(typeof option.description).toBe("string");
      expect(typeof option.fileName).toBe("string");
      expect(typeof option.duration).toBe("number");
      expect(option.duration).toBeGreaterThan(0);
      expect(option.duration).toBeLessThan(5000); // 合理的音效时长
    });
  });

  it("should have unique sound IDs", () => {
    const ids = Object.keys(SOUND_OPTIONS);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should have unique file names", () => {
    const fileNames = Object.values(SOUND_OPTIONS).map((opt) => opt.fileName);
    const uniqueFileNames = new Set(fileNames);
    expect(uniqueFileNames.size).toBe(fileNames.length);
  });
});

describe("Sound Priority Recommendation", () => {
  it("should recommend soft sound for low priority", () => {
    const soundId = getRecommendedSoundForPriority("low");
    const option = SOUND_OPTIONS[soundId];
    expect(option.category).toBe("soft");
  });

  it("should recommend medium sound for medium priority", () => {
    const soundId = getRecommendedSoundForPriority("medium");
    const option = SOUND_OPTIONS[soundId];
    expect(option.category).toBe("medium");
  });

  it("should recommend loud sound for high priority", () => {
    const soundId = getRecommendedSoundForPriority("high");
    const option = SOUND_OPTIONS[soundId];
    expect(option.category).toBe("loud");
  });

  it("should return default for unknown priority", () => {
    const soundId = getRecommendedSoundForPriority("unknown" as any);
    expect(soundId).toBe("default");
  });
});

describe("Sound ID Validation", () => {
  it("should validate correct sound IDs", () => {
    const validIds: SoundId[] = [
      "default",
      "chime",
      "bell",
      "ding",
      "ping",
      "pop",
      "alert",
    ];

    validIds.forEach((id) => {
      expect(isValidSoundId(id)).toBe(true);
    });
  });

  it("should reject invalid sound IDs", () => {
    const invalidIds = ["invalid", "unknown", "test", "sound123", ""];

    invalidIds.forEach((id) => {
      expect(isValidSoundId(id)).toBe(false);
    });
  });

  it("should reject non-string values", () => {
    expect(isValidSoundId(123)).toBe(false);
    expect(isValidSoundId(null)).toBe(false);
    expect(isValidSoundId(undefined)).toBe(false);
    expect(isValidSoundId({})).toBe(false);
    expect(isValidSoundId([])).toBe(false);
  });
});

describe("Sound Categories", () => {
  it("should have at least one soft sound", () => {
    const softSounds = Object.values(SOUND_OPTIONS).filter(
      (opt) => opt.category === "soft"
    );
    expect(softSounds.length).toBeGreaterThan(0);
  });

  it("should have at least one medium sound", () => {
    const mediumSounds = Object.values(SOUND_OPTIONS).filter(
      (opt) => opt.category === "medium"
    );
    expect(mediumSounds.length).toBeGreaterThan(0);
  });

  it("should have at least one loud sound", () => {
    const loudSounds = Object.values(SOUND_OPTIONS).filter(
      (opt) => opt.category === "loud"
    );
    expect(loudSounds.length).toBeGreaterThan(0);
  });
});
