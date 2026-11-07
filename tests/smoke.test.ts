import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { APP_NAME, APP_VERSION } from "@/lib/constants";

describe("QueueX Smoke Tests", () => {
  it("verifies className utility merges properly", () => {
    expect(cn("px-2", "py-1")).toContain("px-2");
    expect(cn("px-2", undefined, "text-sm")).toContain("text-sm");
  });

  it("verifies site configuration has QueueX branding", () => {
    expect(siteConfig.name).toBe("QueueX");
    expect(siteConfig.tagline).toBeDefined();
    expect(siteConfig.event).toContain("GDG Vizag Local2Global Hackathon");
  });

  it("verifies application constants", () => {
    expect(APP_NAME).toBe("QueueX");
    expect(APP_VERSION).toBe("0.1.0");
  });
});
