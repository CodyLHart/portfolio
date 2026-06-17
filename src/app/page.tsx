import Header from "@/components/layout/Header";
import { projects } from "@/data/projects";
import Link from "next/link";

const featuredProjects = projects.filter((project) => project.featured);

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-black">
      <Header />
      <main
        className="min-h-[calc(100vh-80px)] px-5 py-8 md:px-8 md:py-12 bg-red-500/50 mix-blend-multiply "
        // style={{ backgroundColor: "rgba(234, 179, 8, 0.5)" }}
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
          <section
            style={{ boxShadow: "1px 1px 5px 2px #00000015" }}
            className="grid gap-8 bg-white px-6 py-7 md:grid-cols-[1.1fr_0.9fr] md:items-end md:px-8 md:py-9"
          >
            <div>
              <p className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-yellow-700">
                Cody Hart
              </p>
              <h1 className="mt-3 font-serif text-5xl leading-none md:text-7xl">
                A portfolio of independent apps, design systems, and
                experiments.
              </h1>
            </div>
            <p className="text-lg leading-8 text-neutral-800">
              This site is now the launchpad. Each project can live in its own
              app folder, choose its own stack, and still be discoverable from
              one central portfolio.
            </p>
          </section>

          <section className="grid gap-5 md:grid-cols-2">
            {featuredProjects.map((project) => (
              <article
                key={project.slug}
                style={{ boxShadow: "1px 1px 5px 2px #00000015" }}
                className="flex min-h-80 flex-col justify-between bg-white p-5 md:p-6"
              >
                <div>
                  <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-yellow-700">
                    {project.kind}
                  </p>
                  <h2 className="mt-3 font-serif text-4xl leading-none">
                    {project.name}
                  </h2>
                  <p className="mt-4 leading-7 text-neutral-800">
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
                      className="border border-black bg-white px-4 py-2 font-sans text-sm font-semibold text-black hover:bg-neutral-50"
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
            className="w-fit bg-white px-5 py-3 font-sans text-sm font-semibold text-black hover:bg-neutral-50"
            href="/projects"
            style={{ boxShadow: "1px 1px 5px 2px #00000015" }}
          >
            View all projects
          </Link>
        </div>
      </main>
    </div>
  );
}
