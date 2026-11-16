import { Link, Outlet } from "react-router";

export function Layout() {
  return (
    <>
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:p-3 focus:bg-white">
        Pular para o conteúdo
      </a>
      <header className="border-b border-borda bg-white">
        <nav aria-label="Principal" className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
          <Link to="/" className="text-xl font-bold text-primaria focus-visible:outline-2 focus-visible:outline-primaria">
            Kamby
          </Link>
        </nav>
      </header>
      <main id="conteudo" className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </>
  );
}
