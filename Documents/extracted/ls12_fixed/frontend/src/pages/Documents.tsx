import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Clock, Landmark, ChevronRight } from "lucide-react";
import { ScreenShell } from "@/components/layout/ScreenShell";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/common/Button";
import { DOCUMENT_CATEGORIES, DOCUMENT_TEMPLATES } from "@/data/documents";
import { cn } from "@/lib/utils";

const Documents = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [active, setActive] = useState("All");
  const list = active === "All" ? DOCUMENT_TEMPLATES : DOCUMENT_TEMPLATES.filter((d) => d.category === active);

  return (
    <ScreenShell>
      <StickyHeader title={t("legalDocuments")} showLanguagePill />
      <div className="px-6 pt-4 pb-6">
        <button
          onClick={() => navigate("/portal-tracker")}
          className="w-full text-left ls-card p-4 mb-4 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20 tap"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
              <Landmark size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-semibold text-sm">Government Portals & Tracker</h3>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                Consumer · Cyber · Labour · RTI — file, pay & track in one place.
              </p>
            </div>
            <ChevronRight size={18} className="text-primary shrink-0" />
          </div>
        </button>

        <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-6 px-6 pb-2">
          {DOCUMENT_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={cn(
                "ls-chip whitespace-nowrap tap",
                active === c ? "bg-primary text-primary-foreground border-primary" : ""
              )}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {list.map((d) => (
            <div
              key={d.id}
              className={cn(
                "ls-card p-4",
                d.featured && "border-accent/40 bg-accent/5"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", d.featured ? "bg-accent text-accent-foreground" : "bg-primary/10 text-primary")}>
                  <FileText size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-sm">{d.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{d.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-success/10 text-success font-medium">{t("free")}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium">{t("courtAccepted")}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">12 languages</span>
                  </div>
                  {d.featured && (
                    <p className="text-[11px] text-accent font-semibold mt-2">{d.generatedThisMonth?.toLocaleString()}+ generated this month</p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                  <Clock size={12} /> ~{d.estMinutes} min
                </span>
                <Button className="h-9 text-xs px-4" onClick={() => navigate("/documents/new", { state: { id: d.id } })}>
                  {t("generate")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScreenShell>
  );
};

export default Documents;
