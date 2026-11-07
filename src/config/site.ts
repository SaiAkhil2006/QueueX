export const siteConfig = {
  name: "QueueX",
  shortName: "QueueX",
  description:
    "Intelligent Outpatient Department (OPD) queue management and operational intelligence system.",
  tagline: "Intelligent OPD Queue Management & Operational Intelligence",
  event: "GDG Vizag Local2Global Hackathon",
  navItems: [
    { label: "Overview", href: "#overview" },
    { label: "OPD Queues", href: "#queues" },
    { label: "Operational Insights", href: "#insights" },
    { label: "Architecture", href: "#architecture" },
  ],
  links: {
    github: "https://github.com/SaiAkhil2006/QueueX",
  },
} as const;

export type SiteConfig = typeof siteConfig;
