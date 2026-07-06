import Header from "@/components/layout/Header";
import { getProject, projects } from "@/data/projects";
import Link from "next/link";
import { notFound } from "next/navigation";

type ProjectPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return projects.map((project) => ({
    slug: project.slug,
  }));
}

export async function generateMetadata({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project) {
    return {
      title: "Project not found | Cody Hart",
    };
  }

  return {
    title: `${project.name} | Cody Hart`,
    description: project.summary,
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <Header />
      <main
        className="min-h-[calc(100vh-80px)] bg-yellow-500/50 px-5 py-8 md:px-8 md:py-12"
      >
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
          <Link
            className="w-fit bg-white px-4 py-2 font-mono text-sm font-semibold uppercase text-black hover:bg-neutral-50"
            href="/"
            style={{ boxShadow: "1px 1px 5px 2px #00000015" }}
          >
            Back to projects
          </Link>

          <section
            className="bg-white px-6 py-7 md:px-8 md:py-9"
            style={{ boxShadow: "1px 1px 5px 2px #00000015" }}
          >
            <p className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-yellow-700">
              {project.status}
            </p>
            <h1 className="page-title mt-3 font-serif">
              {project.name}
            </h1>
            <p className="mt-5 text-lg leading-8 text-neutral-800">
              {project.summary}
            </p>
          </section>

          <section
            className="grid gap-6 bg-white px-6 py-7 md:grid-cols-2 md:px-8"
            style={{ boxShadow: "1px 1px 5px 2px #00000015" }}
          >
            <div>
              <h2 className="section-title font-serif">Stack</h2>
              <div className="mt-4 flex flex-wrap gap-2">
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

            <div>
              <h2 className="section-title font-serif">
                Source location
              </h2>
              <p className="mt-4 font-mono text-sm text-neutral-700">
                {project.sourcePath ?? `apps/${project.slug}`}
              </p>
            </div>
          </section>

          {project.notes ? (
            <section
              className="bg-white px-6 py-7 md:px-8"
              style={{ boxShadow: "1px 1px 5px 2px #00000015" }}
            >
              <h2 className="section-title font-serif">Notes</h2>
              <p className="mt-3 leading-7 text-neutral-800">
                {project.notes}
              </p>
            </section>
          ) : null}

          {project.href ? (
            <a
              className="w-fit bg-black px-5 py-3 font-sans text-sm font-semibold text-white hover:bg-neutral-800"
              href={project.href}
            >
              Open project
            </a>
          ) : null}
        </div>
      </main>
    </div>
  );
}
