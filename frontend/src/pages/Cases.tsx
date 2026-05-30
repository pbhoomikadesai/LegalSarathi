import { useNavigate } from "react-router-dom";
import { FileText, MessageSquare, Plus, ScrollText, ExternalLink } from "lucide-react";
import { ScreenShell } from "@/components/layout/ScreenShell";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { Button } from "@/components/common/Button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCases, type CaseStatus, type UserCase } from "@/contexts/CasesContext";
import { cn } from "@/lib/utils";

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
      <StickyHeader title={t("myCasesTitle")} showBack showLanguagePill />
      <div className="px-6 pt-4 pb-8">
        
        {/* eCourts Portal Redirect Card */}
        <div className="mb-6 ls-card p-4 bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ExternalLink size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-semibold text-sm leading-tight text-foreground">Official eCourts Portal</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-3 leading-relaxed">
                Check official case progress, hearing dates, and court details directly via CNR number.
              </p>
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => window.open("https://services.ecourts.gov.in/ecourtindia_v6/", "_blank")}
              >
                Check Case Status
              </Button>
            </div>
          </div>
        </div>

        {cases.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted text-muted-foreground flex items-center justify-center mx-auto">
              <ScrollText size={28} />
            </div>
            <h2 className="mt-4 font-display font-semibold text-base">{t("noCasesYet")}</h2>
            <p className="mt-1 text-xs text-muted-foreground max-w-[260px] mx-auto">{t("noCasesSub")}</p>
            <Button className="mt-6" leftIcon={<Plus size={16} />} onClick={() => navigate("/documents")}>
              {t("startNewCase")}
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {cases.map((c) => (
              <CaseCard key={c.id} c={c} />
            ))}
          </ul>
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
    <li>
      <button
        onClick={() => navigate(c.type === "query" ? "/chat" : "/documents")}
        className="w-full text-left ls-card p-4 tap"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icon size={18} />
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
    </li>
  );
};

export default Cases;
