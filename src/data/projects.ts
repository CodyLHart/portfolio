export type PortfolioProject = {
  slug: string;
  name: string;
  summary: string;
  kind: string;
  stack: string[];
  status: "live" | "planned" | "draft";
  featured?: boolean;
  href?: string;
  sourcePath?: string;
  notes?: string;
};

export const projects: PortfolioProject[] = [
  {
    slug: "portfolio-shell",
    name: "Portfolio Shell",
    summary:
      "The central Next.js launchpad for independent applications, design work, and experiments.",
    kind: "Portfolio infrastructure",
    stack: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Vercel"],
    status: "live",
    featured: true,
    href: "/",
    sourcePath: ".",
    notes:
      "This root app stays connected to Vercel so the existing GitHub deployment flow can keep publishing the portfolio.",
  },
  {
    slug: "design-portfolio",
    name: "Design Portfolio",
    summary:
      "A gallery of graphic design, merchandise, logo, and poster work moved out of the root landing page into its own portfolio experience.",
    kind: "Design gallery",
    stack: ["Next.js", "React", "TypeScript", "Tailwind CSS"],
    status: "live",
    featured: true,
    href: "/design-portfolio",
    sourcePath: "apps/design-portfolio",
    notes:
      "This is currently served by the portfolio shell route while its project metadata lives under apps/design-portfolio. It can become a separate Next deployment later.",
  },
  {
    slug: "habit-tracker",
    name: "Habit Tracker",
    summary:
      "A C# and SQL-backed habit tracker with variable targets, calendar analytics, Google sign-in, and icon-assisted habit creation.",
    kind: "Full-stack app",
    stack: [
      "ASP.NET Core",
      "C#",
      "SQLite",
      "Entity Framework Core",
      "React",
      "Vite",
      "TypeScript",
    ],
    status: "draft",
    featured: true,
    href: "http://127.0.0.1:5173",
    sourcePath: "apps/habit-tracker",
    notes:
      "The first version uses SQLite locally and is structured so the database provider can be changed later. The open link points at the local Vite app until the habit tracker frontend is deployed.",
  },
];

export const getProject = (slug: string) =>
  projects.find((project) => project.slug === slug);
