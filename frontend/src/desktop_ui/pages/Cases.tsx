import { useNavigate } from "react-router-dom";
import { FileText, MessageSquare, Plus, ScrollText } from "lucide-react";
import { ScreenShell } from "@desktop/components/layout/ScreenShell";
import { StickyHeader } from "@desktop/components/layout/StickyHeader";
import { Button } from "@desktop/components/common/Button";
import { useLanguage } from "@desktop/contexts/LanguageContext";
import { useCases, type CaseStatus, type UserCase } from "@desktop/contexts/CasesContext";
import { cn } from "@desktop/lib/utils";

const statusKey: Record<CaseStatus, "caseStatusDraft" | "caseStatusActive" | "caseStatusResolved"> = {
  draft: "caseStatusDraft",
  active: "caseStatusActive",
  resolved: "caseStatusResolved",
};

const statusClass: Record<CaseStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-primary/10 text-primary",
  resolved: "bg-success/10 text-success",
};

const Cases = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { cases } = useCases();

  return (
    <ScreenShell>
      <StickyHeader title={t("myCasesTitle")} showLanguagePill />
      <div className="px-8 pt-6 pb-10 max-w-5xl">
        {cases.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-full bg-muted text-muted-foreground flex items-center justify-center mx-auto">
              <ScrollText size={32} />
            </div>
            <h2 className="mt-5 font-display font-semibold text-lg">{t("noCasesYet")}</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">{t("noCasesSub")}</p>
            <Button className="mt-8" leftIcon={<Plus size={16} />} onClick={() => navigate("/documents")}>
              {t("startNewCase")}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {cases.map((c) => (
              <CaseCard key={c.id} c={c} />
            ))}
          </div>
        )}
      </div>
    </ScreenShell>
  );
};

const CaseCard = ({ c }: { c: UserCase }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const Icon = c.type === "document" || c.type === "rti" ? FileText : MessageSquare;
  return (
    <button
      onClick={() => navigate(c.type === "query" ? "/chat" : "/documents")}
      className="w-full text-left ls-card p-5 tap hover:border-primary/30 transition-colors"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display font-semibold text-sm leading-tight truncate">{c.title}</h3>
            <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap", statusClass[c.status])}>
              {t(statusKey[c.status])}
            </span>
          </div>
          {c.subtitle && <p className="text-xs text-muted-foreground mt-1 leading-snug line-clamp-2">{c.subtitle}</p>}
          <p className="text-[10px] text-muted-foreground mt-2">{new Date(c.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
    </button>
  );
};

export default Cases;
