import Header from "@/components/layout/Header";
import { projects } from "@/data/projects";
import Link from "next/link";

const featuredProjects = projects.filter((project) => project.featured);

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-black">
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-5 py-10 md:px-8">
        <section className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-end">
          <div>
            <p className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-yellow-700">
              Cody Hart
            </p>
            <h1 className="mt-3 font-sans text-5xl font-bold leading-tight md:text-7xl">
              A portfolio of independent apps, design systems, and experiments.
            </h1>
          </div>
          <p className="text-lg leading-8 text-neutral-700">
            This site is now the launchpad. Each project can live in its own
            app folder, choose its own stack, and still be discoverable from one
            central portfolio.
          </p>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          {featuredProjects.map((project) => (
            <article
              key={project.slug}
              className="flex min-h-80 flex-col justify-between border border-neutral-200 bg-neutral-50 p-6 shadow-sm"
            >
              <div>
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                  {project.kind}
                </p>
                <h2 className="mt-3 font-sans text-3xl font-bold">
                  {project.name}
                </h2>
                <p className="mt-4 leading-7 text-neutral-700">
                  {project.summary}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {project.stack.map((tech) => (
                    <span
                      key={tech}
                      className="border border-neutral-300 bg-white px-3 py-1 font-mono text-xs text-neutral-700"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  className="bg-black px-4 py-2 font-sans text-sm font-semibold text-white hover:bg-neutral-800"
                  href={`/projects/${project.slug}`}
                >
                  Details
                </Link>
                {project.href ? (
                  <a
                    className="border border-black px-4 py-2 font-sans text-sm font-semibold text-black hover:bg-white"
                    href={project.href}
                  >
                    Open
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </section>

        <Link
          className="w-fit border border-black px-5 py-3 font-sans text-sm font-semibold text-black hover:bg-neutral-50"
          href="/projects"
        >
          View all projects
        </Link>
      </main>
    </div>
  );
}
