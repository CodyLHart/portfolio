export type PortfolioProject = {
  slug: string;
  name: string;
  summary: string;
  stack: string[];
  status: "live" | "planned" | "draft";
  href?: string;
  sourcePath?: string;
  notes?: string;
};

export const projects: PortfolioProject[] = [
  {
    slug: "portfolio-platform",
    name: "Portfolio Platform",
    summary:
      "The central Next.js site that collects design work today and will link out to independent application builds as they are added.",
    stack: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Vercel"],
    status: "live",
    href: "/",
    sourcePath: ".",
    notes:
      "This root app stays connected to Vercel so the existing GitHub deployment flow can keep publishing the portfolio.",
  },
];

export const getProject = (slug: string) =>
  projects.find((project) => project.slug === slug);
