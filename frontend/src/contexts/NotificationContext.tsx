import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type NotificationType = "document" | "lawyer" | "community" | "law_update" | "booking";

export interface AppNotification {
  id: string;
  type: NotificationType;
  titleKey: string;       // translation key
  descKey: string;
  time: string;           // human-readable
  group: "today" | "yesterday" | "earlier";
  read: boolean;
  actionRoute: string;
}

const STORAGE_KEY = "ls.notifications.v1";

const SEED: AppNotification[] = [
  {
    id: "n1",
    type: "document",
    titleKey: "notifDoc1Title",
    descKey: "notifDoc1Desc",
    time: "10 min",
    group: "today",
    read: false,
    actionRoute: "/documents",
  },
  {
    id: "n2",
    type: "lawyer",
    titleKey: "notifLawyer1Title",
    descKey: "notifLawyer1Desc",
    time: "2h",
    group: "today",
    read: false,
    actionRoute: "/lawyers",
  },
  {
    id: "n3",
    type: "community",
    titleKey: "notifComm1Title",
    descKey: "notifComm1Desc",
    time: "5h",
    group: "today",
    read: true,
    actionRoute: "/community",
  },
  {
    id: "n4",
    type: "law_update",
    titleKey: "notifLaw1Title",
    descKey: "notifLaw1Desc",
    time: "Yesterday",
    group: "yesterday",
    read: true,
    actionRoute: "/chat",
  },
  {
    id: "n5",
    type: "booking",
    titleKey: "notifBooking1Title",
    descKey: "notifBooking1Desc",
    time: "Yesterday",
    group: "yesterday",
    read: false,
    actionRoute: "/profile",
  },
];

const safeGet = (k: string): string | null => {
  try { return window.localStorage.getItem(k); } catch { return null; }
};
const safeSet = (k: string, v: string) => {
  try { window.localStorage.setItem(k, v); } catch { /* */ }
};

interface Ctx {
  items: AppNotification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  remove: (id: string) => void;
}

const NotificationContext = createContext<Ctx | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<AppNotification[]>(() => {
    const raw = safeGet(STORAGE_KEY);
    if (!raw) return SEED;
    try {
      const parsed = JSON.parse(raw) as AppNotification[];
      if (!Array.isArray(parsed) || parsed.length === 0) return SEED;
      return parsed;
    } catch {
      return SEED;
    }
  });

  useEffect(() => {
    safeSet(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const markRead = useCallback((id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);
  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);
  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const unreadCount = items.filter((n) => !n.read).length;

  const value = useMemo<Ctx>(() => ({ items, unreadCount, markRead, markAllRead, remove }), [items, unreadCount, markRead, markAllRead, remove]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
};
