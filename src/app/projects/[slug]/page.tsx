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
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-5 py-10 md:px-8">
        <Link
          className="w-fit font-mono text-sm font-semibold uppercase text-neutral-600 hover:text-black"
          href="/projects"
        >
          Back to projects
        </Link>

        <section>
          <p className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-yellow-700">
            {project.status}
          </p>
          <h1 className="mt-3 font-sans text-4xl font-bold leading-tight md:text-6xl">
            {project.name}
          </h1>
          <p className="mt-5 text-lg leading-8 text-neutral-700">
            {project.summary}
          </p>
        </section>

        <section className="grid gap-6 border-y border-neutral-200 py-8 md:grid-cols-2">
          <div>
            <h2 className="font-sans text-lg font-bold">Stack</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {project.stack.map((tech) => (
                <span
                  key={tech}
                  className="border border-neutral-300 bg-neutral-50 px-3 py-1 font-mono text-xs text-neutral-700"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-sans text-lg font-bold">Source location</h2>
            <p className="mt-4 font-mono text-sm text-neutral-700">
              {project.sourcePath ?? `apps/${project.slug}`}
            </p>
          </div>
        </section>

        {project.notes ? (
          <section>
            <h2 className="font-sans text-lg font-bold">Notes</h2>
            <p className="mt-3 leading-7 text-neutral-700">{project.notes}</p>
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
      </main>
    </div>
  );
}
