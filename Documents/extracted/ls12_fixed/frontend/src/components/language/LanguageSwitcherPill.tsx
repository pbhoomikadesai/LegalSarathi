import { Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  onOpen: () => void;
}

export const LanguageSwitcherPill = ({ onOpen }: Props) => {
  const { meta } = useLanguage();
  return (
    <button
      onClick={onOpen}
      aria-label={`Change language. Current: ${meta.short}`}
      className="tap inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-border bg-card hover:bg-muted text-xs font-semibold"
    >
      <Globe size={14} className="text-primary" />
      <span>{meta.short}</span>
    </button>
  );
};
