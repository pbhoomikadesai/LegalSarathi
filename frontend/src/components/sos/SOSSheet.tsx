import { useEffect } from "react";
import { Phone, Shield, Users, Baby, Scale, X, type LucideIcon } from "lucide-react";
import { useSOS } from "@/contexts/SOSContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface SOSItem {
  key: "police" | "women" | "child" | "legal";
  number: string;
  icon: LucideIcon;
  color: string; // tailwind bg
}

const ITEMS: SOSItem[] = [
  { key: "police", number: "100", icon: Shield, color: "bg-destructive/10 text-destructive" },
  { key: "women", number: "1091", icon: Users, color: "bg-accent/15 text-accent" },
  { key: "child", number: "1098", icon: Baby, color: "bg-primary/10 text-primary" },
  { key: "legal", number: "15100", icon: Scale, color: "bg-tile-blueGray/15 text-tile-blueGray" },
];

const labelKey = (k: SOSItem["key"]) =>
  k === "police" ? "sosPolice" : k === "women" ? "sosWomen" : k === "child" ? "sosChild" : "sosLegalAid";

export const SOSSheet = () => {
  const { open, hide } = useSOS();
  const { t } = useLanguage();

  // Lock body scroll when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center" role="dialog" aria-modal="true">
      <button
        aria-label="Close"
        onClick={hide}
        className="absolute inset-0 bg-foreground/60 animate-fade-in-up"
      />
      <div className="relative w-full max-w-md bg-card rounded-t-3xl shadow-card p-5 pb-8 animate-slide-from-bottom">
        <div className="mx-auto w-10 h-1.5 rounded-full bg-border mb-4" />
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <h2 className="text-lg font-display font-bold text-destructive">{t("sosTitle")}</h2>
            <p className="text-xs text-muted-foreground mt-1">{t("sosSub")}</p>
          </div>
          <button onClick={hide} aria-label="Close" className="w-9 h-9 -mt-1 -mr-1 rounded-full hover:bg-muted flex items-center justify-center tap">
            <X size={18} />
          </button>
        </div>

        <ul className="mt-4 space-y-2">
          {ITEMS.map(({ key, number, icon: Icon, color }) => (
            <li key={key}>
              <a
                href={`tel:${number}`}
                onClick={hide}
                className="flex items-center gap-3 p-3 rounded-2xl border border-border tap hover:bg-muted/50"
              >
                <span className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", color)}>
                  <Icon size={20} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold">{t(labelKey(key))}</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">{number}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                  <Phone size={13} />
                  {t("callNow")}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
