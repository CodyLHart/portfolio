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

const externalUrl = (url: string) =>
  url.startsWith("/") || /^https?:\/\//i.test(url) ? url : `https://${url}`;

const habitTrackerUrl = externalUrl(
  process.env.NEXT_PUBLIC_HABIT_TRACKER_URL ?? "http://127.0.0.1:5173",
);
const gamesUrl = externalUrl(
  process.env.NEXT_PUBLIC_GAMES_URL ?? "http://127.0.0.1:5174",
);

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
      "PostgreSQL",
      "Entity Framework Core",
      "React",
      "Vite",
      "TypeScript",
    ],
    status: "live",
    featured: true,
    href: habitTrackerUrl,
    sourcePath: "apps/habit-tracker",
    notes:
      "The production app runs as an independent Vite frontend, ASP.NET Core API, and Neon PostgreSQL database while keeping SQLite available for local development.",
  },
  {
    slug: "games",
    name: "Games",
    summary:
      "A growing arcade of browser games, starting with mobile-friendly Klondike Solitaire.",
    kind: "Interactive games",
    stack: [
      "React",
      "Vite",
      "TypeScript",
      "Tailwind CSS",
      "dnd-kit",
      "Zustand",
      "Motion",
    ],
    status: "live",
    featured: true,
    href: gamesUrl,
    sourcePath: "apps/games",
    notes:
      "The first game is Klondike Solitaire with draw 1/draw 3, standard and Vegas scoring, undo, tap-to-move, drag/drop controls, and local stats persistence.",
  },
];

export const getProject = (slug: string) =>
  projects.find((project) => project.slug === slug);
