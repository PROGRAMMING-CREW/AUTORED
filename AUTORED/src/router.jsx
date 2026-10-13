import { createBrowserRouter } from "react-router";
import App from "./App.jsx";
import Registro from "./Login/Registro.jsx";
import Login from "./Login/Login.jsx";
import Catalogo from "./Usuario/Catalogo.jsx"

export const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/registro", element: <Registro /> },
  { path: "/login", element: <Login /> },
  { path: "/catalogo", element: <Catalogo /> },


]);