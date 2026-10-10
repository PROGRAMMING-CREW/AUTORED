import { createBrowserRouter } from "react-router";
import App from "./App.jsx";
import Registro from "./Login/Registro.jsx";

export const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/registro", element: <Registro /> },
]);