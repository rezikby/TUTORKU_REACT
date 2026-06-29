
import "./i18n";
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { requestNotificationPermission } from "./app/lib/notifications";

// Request notification permission and register service worker for chat push
if (typeof window !== "undefined" && 'Notification' in window && 'serviceWorker' in navigator) {
  void requestNotificationPermission();
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

createRoot(document.getElementById("root")!).render(<App />);
  