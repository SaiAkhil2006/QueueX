import { describe, it, expect } from "vitest";
import { NAVIGATION_SECTIONS } from "@/components/layout/sidebar-nav";

describe("QueueX Navigation & Route Mappings", () => {
  it("defines all required navigation sections in the correct order", () => {
    const sectionTitles = NAVIGATION_SECTIONS.map((s) => s.title);
    expect(sectionTitles).toEqual([
      "OVERVIEW",
      "HOSPITAL MANAGEMENT",
      "PATIENT MANAGEMENT",
      "QUEUE OPERATIONS",
      "INTELLIGENCE",
      "INSIGHTS",
    ]);
  });

  it("contains all 13 required route paths", () => {
    const allHrefs = NAVIGATION_SECTIONS.flatMap((s) => s.items.map((i) => i.href));
    const expectedRoutes = [
      "/dashboard",
      "/hospital",
      "/departments",
      "/doctors",
      "/schedules",
      "/patients",
      "/appointments",
      "/queue",
      "/sessions",
      "/predictions",
      "/optimization",
      "/simulations",
      "/analytics",
    ];

    expect(allHrefs).toHaveLength(13);
    expectedRoutes.forEach((route) => {
      expect(allHrefs).toContain(route);
    });
  });

  it("ensures no duplicate route hrefs exist", () => {
    const allHrefs = NAVIGATION_SECTIONS.flatMap((s) => s.items.map((i) => i.href));
    const uniqueHrefs = new Set(allHrefs);
    expect(uniqueHrefs.size).toBe(allHrefs.length);
  });

  it("ensures every item has a valid title, href, and icon component", () => {
    NAVIGATION_SECTIONS.forEach((section) => {
      expect(section.title.length).toBeGreaterThan(0);
      section.items.forEach((item) => {
        expect(item.title.length).toBeGreaterThan(0);
        expect(item.href.startsWith("/")).toBe(true);
        expect(item.icon).toBeDefined();
      });
    });
  });
});
