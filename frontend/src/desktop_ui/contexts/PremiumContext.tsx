import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type PremiumTrigger =
  | "guest_limit"
  | "video_call"
  | "document_limit"
  | "community_limit"
  | "premium_feature"
  | "follow_up";

interface Ctx {
  open: boolean;
  trigger: PremiumTrigger | null;
  show: (trigger: PremiumTrigger) => void;
  close: () => void;
}

const PremiumContext = createContext<Ctx | undefined>(undefined);

export const PremiumProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [trigger, setTrigger] = useState<PremiumTrigger | null>(null);

  const show = useCallback((t: PremiumTrigger) => {
    setTrigger(t);
    setOpen(true);
  }, []);
  const close = useCallback(() => setOpen(false), []);

  const value = useMemo<Ctx>(() => ({ open, trigger, show, close }), [open, trigger, show, close]);
  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
};

export const usePremium = () => {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error("usePremium must be used within PremiumProvider");
  return ctx;
};
