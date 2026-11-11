import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Landing } from "./Landing";
import { Toaster } from "./components/ui/sonner";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode><Landing /><Toaster /></StrictMode>
);
