import { useQuery } from "@tanstack/react-query";

import { api, chamar } from "@/lib/api";

export function PaginaInicio() {
  const bancos = useQuery({ queryKey: ["bancos"], queryFn: () => chamar(api.GET("/api/v1/bancos")) });

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold">Painel do banco de leite</h1>
      <p className="text-texto-suave">
        As telas do painel estão em construção. Enquanto isso, a equipe opera pelo{" "}
        <a href="/admin/" className="font-semibold text-primaria underline">
          admin
        </a>
        .
      </p>
      <p role="status">
        {bancos.isPending && "Conectando à API..."}
        {bancos.isError && "Não foi possível conectar à API."}
        {bancos.data && `API conectada. Bancos ativos: ${bancos.data.length}.`}
      </p>
    </section>
  );
}
