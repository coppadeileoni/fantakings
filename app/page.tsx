/* eslint-disable @next/next/no-img-element */
export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center font-sans">
      <div className="flex flex-col items-center space-y-6 px-4">
        <h1 className="text-6xl font-bold tracking-wide text-black dark:text-zinc-50 text-center">
          FANTA KINGS
        </h1>
        <p className="text-xl font-medium text-zinc-600 dark:text-zinc-200 text-center">
          Coppa dei leoni - Christmas edition
        </p>
        <img
          src="/coppadeileoni-light.png"
          alt="Coppa dei Leoni"
          className="h-64 w-auto"
        />
        <a
          href="/crea-squadra"
          className="rounded-full bg-black px-6 py-2 text-lg font-semibold text-zinc-50 transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
        >
          Crea squadra
        </a>
      </div>
    </div>
  );
}
