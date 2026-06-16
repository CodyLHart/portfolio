import Header from "@/components/layout/Header";
import { projects } from "@/data/projects";
import Link from "next/link";

const statusLabel = {
  live: "Live",
  planned: "Planned",
  draft: "Draft",
};

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-10 md:px-8">
        <section className="max-w-3xl">
          <p className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-yellow-700">
            Independent apps
          </p>
          <h1 className="mt-3 font-sans text-4xl font-bold leading-tight md:text-6xl">
            Projects built to grow beyond one stack.
          </h1>
          <p className="mt-5 text-lg leading-8 text-neutral-700">
            This portfolio can now point to standalone apps that live in their
            own folders, own their dependencies, and can use whatever framework
            or language makes sense for the project.
          </p>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          {projects.map((project) => (
            <article
              key={project.slug}
              className="flex min-h-72 flex-col justify-between border border-neutral-200 bg-neutral-50 p-6 shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between gap-4">
                  <h2 className="font-sans text-2xl font-bold">
                    {project.name}
                  </h2>
                  <span className="whitespace-nowrap rounded-full bg-black px-3 py-1 font-mono text-xs font-semibold uppercase text-white">
                    {statusLabel[project.status]}
                  </span>
                </div>
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
                  View details
                </Link>
                {project.href ? (
                  <a
                    className="border border-black px-4 py-2 font-sans text-sm font-semibold text-black hover:bg-white"
                    href={project.href}
                  >
                    Open project
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
