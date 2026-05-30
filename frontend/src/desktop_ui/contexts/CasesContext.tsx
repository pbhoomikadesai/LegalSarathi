import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CaseType = "document" | "query" | "rti";
export type CaseStatus = "draft" | "active" | "resolved";

export interface UserCase {
  id: string;
  type: CaseType;
  title: string;
  subtitle?: string;
  status: CaseStatus;
  createdAt: number;
  meta?: Record<string, unknown>;
}

interface Ctx {
  cases: UserCase[];
  addCase: (c: Omit<UserCase, "id" | "createdAt"> & { id?: string }) => UserCase;
  removeCase: (id: string) => void;
  setStatus: (id: string, status: CaseStatus) => void;
}

const KEY = "ls.cases.v1";

const safeGet = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]") as UserCase[]; } catch { return []; }
};
const safeSet = (v: UserCase[]) => {
  try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* no-op */ }
};

const CasesContext = createContext<Ctx | undefined>(undefined);

export const CasesProvider = ({ children }: { children: ReactNode }) => {
  const [cases, setCases] = useState<UserCase[]>(() => safeGet());

  useEffect(() => { safeSet(cases); }, [cases]);

  const addCase: Ctx["addCase"] = useCallback((c) => {
    const item: UserCase = {
      id: c.id ?? `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: Date.now(),
      type: c.type,
      title: c.title,
      subtitle: c.subtitle,
      status: c.status,
      meta: c.meta,
    };
    setCases((p) => [item, ...p]);
    return item;
  }, []);

  const removeCase = useCallback((id: string) => setCases((p) => p.filter((c) => c.id !== id)), []);
  const setStatus = useCallback(
    (id: string, status: CaseStatus) => setCases((p) => p.map((c) => (c.id === id ? { ...c, status } : c))),
    []
  );

  const value = useMemo<Ctx>(() => ({ cases, addCase, removeCase, setStatus }), [cases, addCase, removeCase, setStatus]);
  return <CasesContext.Provider value={value}>{children}</CasesContext.Provider>;
};

export const useCases = () => {
  const ctx = useContext(CasesContext);
  if (!ctx) throw new Error("useCases must be used within CasesProvider");
  return ctx;
};
