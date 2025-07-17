import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import Header from "./components/layout/Header.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div className="h-svh flex flex-col bg-background-accent">
      <div className="sticky top-0 bg-background-accent z-50 pt-4">
        <Header />
      </div>
      <main className="flex-1 bg-background-secondary flex flex-col">
        <App />
      </main>
    </div>
  </StrictMode>
);
