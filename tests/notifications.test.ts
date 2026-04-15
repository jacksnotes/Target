import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReminderConfig } from "../lib/types";

describe("ReminderConfig", () => {
  it("should create a valid reminder config", () => {
    const config: ReminderConfig = {
      enabled: true,
      time: "09:30",
    };
    expect(config.enabled).toBe(true);
    expect(config.time).toBe("09:30");
  });

  it("should handle disabled reminders", () => {
    const config: ReminderConfig = {
      enabled: false,
      time: "09:30",
    };
    expect(config.enabled).toBe(false);
  });

  it("should validate time format HH:mm", () => {
    const validTimes = ["00:00", "09:30", "12:00", "23:59"];
    validTimes.forEach((time) => {
      const [hours, minutes] = time.split(":").map(Number);
      expect(hours >= 0 && hours <= 23).toBe(true);
      expect(minutes >= 0 && minutes <= 59).toBe(true);
    });
  });

  it("should reject invalid time formats", () => {
    const invalidTimes = ["24:00", "12:60", "-1:00", "abc:def"];
    invalidTimes.forEach((time) => {
      const [hours, minutes] = time.split(":").map(Number);
      const isValid = hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
      expect(isValid).toBe(false);
    });
  });
});

describe("Time Parsing and Formatting", () => {
  function parseTimeString(timeStr: string): Date {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  function formatTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  it("should parse time string correctly", () => {
    const timeStr = "14:30";
    const date = parseTimeString(timeStr);
    expect(date.getHours()).toBe(14);
    expect(date.getMinutes()).toBe(30);
  });

  it("should format date to time string correctly", () => {
    const date = new Date();
    date.setHours(9, 15, 0, 0);
    const timeStr = formatTime(date);
    expect(timeStr).toBe("09:15");
  });

  it("should round-trip time correctly", () => {
    const originalTime = "18:45";
    const date = parseTimeString(originalTime);
    const formattedTime = formatTime(date);
    expect(formattedTime).toBe(originalTime);
  });

  it("should pad single digit hours and minutes", () => {
    const date = new Date();
    date.setHours(5, 3, 0, 0);
    const timeStr = formatTime(date);
    expect(timeStr).toBe("05:03");
  });
});

describe("Reminder Configuration Updates", () => {
  it("should update reminder from disabled to enabled", () => {
    const oldConfig: ReminderConfig = {
      enabled: false,
      time: "09:00",
    };
    const newConfig: ReminderConfig = {
      enabled: true,
      time: "10:00",
    };
    expect(oldConfig.enabled).toBe(false);
    expect(newConfig.enabled).toBe(true);
    expect(newConfig.time).toBe("10:00");
  });

  it("should update reminder time while keeping enabled state", () => {
    const oldConfig: ReminderConfig = {
      enabled: true,
      time: "09:00",
    };
    const newConfig: ReminderConfig = {
      ...oldConfig,
      time: "15:30",
    };
    expect(newConfig.enabled).toBe(true);
    expect(newConfig.time).toBe("15:30");
  });

  it("should disable reminder while preserving time", () => {
    const oldConfig: ReminderConfig = {
      enabled: true,
      time: "09:00",
    };
    const newConfig: ReminderConfig = {
      ...oldConfig,
      enabled: false,
    };
    expect(newConfig.enabled).toBe(false);
    expect(newConfig.time).toBe("09:00");
  });
});
