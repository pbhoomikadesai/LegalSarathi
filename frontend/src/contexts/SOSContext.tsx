import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface SOSContextValue {
  open: boolean;
  show: () => void;
  hide: () => void;
}

const SOSContext = createContext<SOSContextValue | undefined>(undefined);

export const SOSProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const show = useCallback(() => setOpen(true), []);
  const hide = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({ open, show, hide }), [open, show, hide]);
  return <SOSContext.Provider value={value}>{children}</SOSContext.Provider>;
};

export const useSOS = () => {
  const ctx = useContext(SOSContext);
  if (!ctx) throw new Error("useSOS must be used within SOSProvider");
  return ctx;
};
