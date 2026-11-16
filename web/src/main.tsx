import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";

import { Layout } from "@/components/Layout";
import { PaginaInicio } from "@/features/painel/pages/Inicio";
import "./index.css";

const queryClient = new QueryClient();
const router = createBrowserRouter([{ element: <Layout />, children: [{ index: true, element: <PaginaInicio /> }] }]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
