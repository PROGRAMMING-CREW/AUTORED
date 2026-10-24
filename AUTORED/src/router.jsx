import { createBrowserRouter } from "react-router";
import App from "./App.jsx";
import Registro from "./Login/Registro.jsx";
import Login from "./Login/Login.jsx";
import Catalogo from "./Usuario/Catalogo.jsx"
import Inicio from "./Usuario/Inicio.jsx"
import Sucursales from "./Usuario/Sucursales.jsx"
import DetalleProducto from "./Usuario/DetalleProducto.jsx";

export const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/registro", element: <Registro /> },
  { path: "/login", element: <Login /> },
  { path: "/inicio", element: <Inicio /> },
  { path: "/catalogo", element: <Catalogo /> },
  { path: "/sucursales", element: <Sucursales /> },
  { path: "/producto/:id", element: <DetalleProducto/> },


]);