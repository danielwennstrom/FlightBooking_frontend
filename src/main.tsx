import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import Header from "./components/layout/Header.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div className="h-svh flex flex-col bg-gray-100">
      <div className="sticky top-0 bg-gray-100 z-50 pt-4">
        <Header />
      </div>
      <main className="flex-1 bg-bot-bubble flex flex-col">
        <App />
      </main>
    </div>
  </StrictMode>
);
