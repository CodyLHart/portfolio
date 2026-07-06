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
const listAppUrl = externalUrl(
  process.env.NEXT_PUBLIC_LIST_APP_URL ?? "http://localhost:3001",
);

export const projects: PortfolioProject[] = [
  {
    slug: "portfolio-shell",
    name: "Portfolio Shell",
    summary:
      "My central Next.js launchpad for the apps, games, design work, and experiments that are growing out of this portfolio.",
    kind: "Portfolio infrastructure",
    stack: [
      "Next.js App Router",
      "React",
      "TypeScript",
      "Tailwind CSS",
      "Vercel",
      "npm Workspaces",
      "Turbopack",
    ],
    status: "live",
    featured: true,
    href: "/",
    sourcePath: ".",
    notes:
      "This is the front door for the whole workspace: a Vercel-friendly root app that keeps the portfolio easy to deploy while each larger project can live as its own app. I use it as a launchpad, a project registry, and a place to explain why I am rebuilding everyday tools in a way that gives me more control over the features and the data.",
  },
  {
    slug: "design-portfolio",
    name: "Design Portfolio",
    summary:
      "A visual archive of poster, merch, logo, album, and product-style design work from shows, bands, brands, and personal concepts.",
    kind: "Design gallery",
    stack: [
      "Next.js App Router",
      "React",
      "TypeScript",
      "Tailwind CSS",
      "next/image",
      "Static Assets",
      "Vercel",
    ],
    status: "live",
    featured: true,
    href: "/design-portfolio",
    sourcePath: "apps/design-portfolio",
    notes:
      "This section collects the more tactile side of my work: tour posters, shirts, logos, album art, and oddball product ideas that care about type, texture, and a little bit of joke timing. It is currently served through the portfolio shell at /design-portfolio so the existing deployment stays simple, with the metadata ready to become a separate app when the design side needs its own build pipeline.",
  },
  {
    slug: "habit-tracker",
    name: "Habit Tracker",
    summary:
      "A full-stack habit tracker for real routines: variable targets, time units, calendar analytics, Google sign-in, and icon-assisted habit creation.",
    kind: "Full-stack app",
    stack: [
      "React",
      "Vite",
      "TypeScript",
      "Tailwind CSS",
      "lucide-react",
      "ASP.NET Core",
      "C#",
      ".NET 10",
      "Entity Framework Core",
      "PostgreSQL",
      "SQLite",
      "Npgsql",
      "Google OAuth",
      "Cookie Auth",
      "Docker",
      "Render",
      "Neon",
    ],
    status: "live",
    featured: true,
    href: habitTrackerUrl,
    sourcePath: "apps/habit-tracker",
    notes:
      "I built this because most habit apps either feel too rigid or turn basic tracking into a subscription. The app supports habits measured in counts or time, partial progress toward daily targets, a calendar view, Google-authenticated accounts, and a C# API with EF Core models and migrations. Local development stays lightweight with SQLite, while production is set up for a Vite frontend, Dockerized ASP.NET Core API, Render hosting, and Neon Postgres.",
  },
  {
    slug: "games",
    name: "Games",
    summary:
      "A small browser arcade with polished Klondike Solitaire and Minesweeper, built for quick breaks on desktop or mobile.",
    kind: "Interactive games",
    stack: [
      "React",
      "Vite",
      "TypeScript",
      "Tailwind CSS",
      "lucide-react",
      "dnd-kit",
      "Zustand",
      "Motion",
      "localStorage",
      "Vitest",
    ],
    status: "live",
    featured: true,
    href: gamesUrl,
    sourcePath: "apps/games",
    notes:
      "This is the fun shelf: familiar games rebuilt with the little quality-of-life details I expect when I actually play them. Solitaire includes draw 1/draw 3, standard and Vegas scoring, tap-to-move, drag-and-drop, undo, animated cards, and persisted stats. Minesweeper includes beginner, intermediate, advanced, and custom boards, first-click-safe mine placement, timers, flags, and local stats by difficulty.",
  },
  {
    slug: "list-app",
    name: "List App",
    summary:
      "A collaborative list app for shared errands and projects, with Google sign-in, friends, roles, realtime updates, rich item metadata, and restorable history.",
    kind: "Full-stack collaboration app",
    stack: [
      "Next.js App Router",
      "React",
      "TypeScript",
      "Supabase Auth",
      "Supabase Realtime",
      "Supabase RPC",
      "Supabase Presence",
      "PostgreSQL",
      "Row Level Security",
      "SQL",
      "Google OAuth",
      "CSS",
    ],
    status: "live",
    featured: true,
    href: listAppUrl,
    sourcePath: "apps/list-app",
    notes:
      "This one is my answer to list apps that are fine for one person and awkward the second another human joins in. It has exact-email friend requests, notifications, owner/editor/viewer roles, share-link invites, realtime list and item updates, collaborator presence, assignable items, optional quantity/category/due-date/priority/notes fields, category grouping and filtering, checked-item cleanup, reusable suggestions from list history, and snapshots that can restore an older version. Supabase handles auth, Postgres, realtime channels, RPC, and RLS so the collaboration rules live close to the data.",
  },
];

export const getProject = (slug: string) =>
  projects.find((project) => project.slug === slug);
