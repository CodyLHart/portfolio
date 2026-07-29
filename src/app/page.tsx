import Header from "@/components/layout/Header";
import { projects } from "@/data/projects";
import Link from "next/link";

const statusLabel = {
  live: "Live",
  planned: "Planned",
  draft: "Draft",
};

const isExternalHref = (href: string) => /^https?:\/\//i.test(href);

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-black">
      <Header />
      <main className="min-h-[calc(100vh-80px)] bg-yellow-500/50 px-5 py-8 mix-blend-multiply md:px-8 md:py-12">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
          <section
            className="max-w-3xl bg-white px-6 py-7 md:px-8 md:py-9"
            style={{ boxShadow: "1px 1px 5px 2px #00000015" }}
          >
            <h1 className="page-title mt-3 font-serif">Hi, I’m Cody.</h1>
            <p className="mt-5 text-lg leading-8 text-neutral-800">
              This portfolio is a small sample of my work. Right now it includes
              an eCommerce project to showcase my bands and apparel company, a
              selected design portfolio, a list app that I use for organizing my
              daily life, and the portfolio site itself. Thanks for taking a
              look!
            </p>
          </section>

          <section className="grid gap-5 md:grid-cols-2">
            {projects.map((project) => (
              <article
                className="flex min-h-72 flex-col justify-between bg-white p-5 md:p-6"
                key={project.slug}
                style={{ boxShadow: "1px 1px 5px 2px #00000015" }}
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="card-title font-serif">{project.name}</h2>
                    <span className="whitespace-nowrap bg-black px-3 py-1 font-mono text-xs font-semibold uppercase text-white">
                      {statusLabel[project.status]}
                    </span>
                  </div>
                  <p className="mt-4 leading-7 text-neutral-800">
                    {project.summary}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {project.stack.map((tech) => (
                      <span
                        className="border border-neutral-300 bg-white px-3 py-1 font-mono text-xs text-neutral-700"
                        key={tech}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap justify-end gap-3">
                  <Link
                    className="border border-black px-4 py-2 font-sans text-sm font-semibold hover:bg-neutral-50"
                    href={`/projects/${project.slug}`}
                  >
                    More Details
                  </Link>
                  {project.href ? (
                    <a
                      className=" bg-black text-white px-4 py-2 font-sans text-sm font-semibold hover:bg-neutral-800"
                      href={project.href}
                      target="blank"
                      aria-label={`Open ${project.name} project`}
                      rel={
                        isExternalHref(project.href) ? "noreferrer" : undefined
                      }
                    >
                      View Site
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
}
