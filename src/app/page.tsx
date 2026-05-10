export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-col items-center gap-3 text-center sm:items-start sm:text-left">
        <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
          Hang tight.
        </h1>
        <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          This portfolio is still having some work done.
        </p>
        <p className="max-w-md text-lg leading-8 text-zinc-950 dark:text-zinc-50">
          Check back soon!
        </p>
      </main>
    </div>
  );
}
