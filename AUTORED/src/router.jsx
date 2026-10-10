// Rutas de la app (React Router v7, modo "data": createBrowserRouter).
import { createBrowserRouter } from "react-router";
import Index from "./Index.jsx";

const Acerca = () => (
  <main className="page py-12">
    <h1 className="page-title">Acerca de</h1>
  </main>
);

const NoEncontrada = () => (
  <main className="page py-12">
    <h1 className="page-title">Página no encontrada</h1>
    <p className="muted mt-2">La ruta que buscas no existe.</p>
  </main>
);

export const router = createBrowserRouter([
  { path: "/", element: <Index /> },
]);
