let unreadChatCount = 0;
let baseTitle = "";
let notificationRegistrationPromise: Promise<ServiceWorkerRegistration | undefined> | null = null;

declare global {
  interface Window {
    __triggerTestChatNotification?: () => Promise<void>;
  }
}

const getBaseTitle = () => {
  if (typeof document === "undefined") return "TUTORKU";
  if (!baseTitle) {
    baseTitle = document.title.replace(/\s*\(\d+\)\s*$/, "").trim() || "TUTORKU";
  }
  return baseTitle;
};

export const setChatMessageBadge = (count: number) => {
  unreadChatCount = Math.max(0, count);
  if (typeof document === "undefined") return;
  const titleBase = getBaseTitle();
  document.title = unreadChatCount > 0 ? `${titleBase} (${unreadChatCount})` : titleBase;
};

export const clearChatMessageBadge = () => {
  unreadChatCount = 0;
  if (typeof document !== "undefined") {
    document.title = getBaseTitle();
  }
};

const playChatMessageSound = () => {
  if (typeof window === "undefined" || typeof window.AudioContext === "undefined") return;

  try {
    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const audioContext = new AudioCtx();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1320, audioContext.currentTime + 0.12);

    gainNode.gain.setValueAtTime(0.001, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.25);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.25);
  } catch {
    // ignore audio errors
  }
};

export const registerNotificationServiceWorker = async () => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return undefined;

  if (!notificationRegistrationPromise) {
    notificationRegistrationPromise = (async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
        return registration;
      } catch (err) {
        console.warn("[notifications] service worker registration failed", err);
        return undefined;
      }
    })();
  }

  return notificationRegistrationPromise;
};

export const requestNotificationPermission = async () => {
  if (typeof window === "undefined" || typeof Notification === "undefined") return false;

  try {
    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }

    return Notification.permission === "granted";
  } catch (err) {
    console.warn("[notifications] permission request failed", err);
    return false;
  }
};

export const showChatMessageNotification = async ({
  title,
  body,
  icon,
}: {
  title: string;
  body: string;
  icon?: string | null;
}): Promise<boolean> => {
  if (typeof window === "undefined") return false;
  console.debug("[notifications] showChatMessageNotification called", { title, body, icon });

  // increase badge if user not viewing
  if (typeof document !== "undefined" && (document.visibilityState !== "visible" || !document.hasFocus())) {
    setChatMessageBadge(unreadChatCount + 1);
  }

  playChatMessageSound();

  if (typeof Notification === "undefined") return false;

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    console.debug("[notifications] no permission to show notifications");
    return false;
  }

  const registration = await registerNotificationServiceWorker();
  const options: any = {
    body,
    icon: icon || "/favicon.ico",
    tag: "tutorku-chat",
    renotify: true,
    requireInteraction: true,
  };

  try {
    if (registration?.showNotification) {
      console.debug("[notifications] showing via service worker", options);
      await registration.showNotification(title, options);
      return true;
    }
  } catch (swErr) {
    console.warn("[notifications] service worker showNotification failed", swErr);
  }

  try {
    console.debug("[notifications] showing via Window Notification", options);
    new Notification(title, options);
    return true;
  } catch (winErr) {
    console.warn("[notifications] window Notification failed", winErr);
    return false;
  }
};

if (typeof window !== "undefined") {
  window.__triggerTestChatNotification = async () => {
    await showChatMessageNotification({
      title: "Tes notifikasi",
      body: "Ini adalah uji notifikasi dari TUTORKU.",
      icon: "/favicon.ico",
    });
  };
}
