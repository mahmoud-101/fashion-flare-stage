import { createRoot } from "react-dom/client";
import ErrorBoundary from "./components/ErrorBoundary";
import App from "./App.tsx";
import "./index.css";
import { supabase } from "@/integrations/supabase/client";

function initErrorMonitoring() {
  window.onerror = (message, source, _lineno, _colno, error) => {
    try {
      supabase.auth.getUser().then(({ data }) => {
        supabase.from("error_logs").insert({
          message: String(message),
          stack: error?.stack ?? null,
          url: source ?? window.location.href,
          user_id: data?.user?.id ?? null,
          created_at: new Date().toISOString(),
        }).then(() => {}).catch(() => {});
      }).catch(() => {});
    } catch {
    }
    return false;
  };

  window.onunhandledrejection = (event) => {
    try {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason);
      const stack = reason instanceof Error ? reason.stack ?? null : null;
      supabase.auth.getUser().then(({ data }) => {
        supabase.from("error_logs").insert({
          message,
          stack,
          url: window.location.href,
          user_id: data?.user?.id ?? null,
          created_at: new Date().toISOString(),
        }).then(() => {}).catch(() => {});
      }).catch(() => {});
    } catch {
    }
  };
}

initErrorMonitoring();

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
