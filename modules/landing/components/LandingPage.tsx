export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-col items-center justify-center gap-8 px-6 py-16">
        <h1 className="text-center text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Landing Page
        </h1>
        <p className="max-w-md text-center text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Contenido de la página de aterrizaje.
        </p>
      </main>
    </div>
  );
}
