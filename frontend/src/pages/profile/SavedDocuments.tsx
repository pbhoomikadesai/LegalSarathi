import { useNavigate } from "react-router-dom";
import { FileText, Plus } from "lucide-react";
import { ScreenShell } from "@/components/layout/ScreenShell";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { Button } from "@/components/common/Button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCases } from "@/contexts/CasesContext";

const SavedDocuments = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { cases } = useCases();
  const docs = cases.filter((c) => c.type === "document" || c.type === "rti");

  return (
    <ScreenShell>
      <StickyHeader title={t("savedDocuments")} showBack showLanguagePill />
      <div className="px-6 pt-4 pb-8">
        {docs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <FileText size={28} className="text-muted-foreground" />
            </div>
            <h2 className="mt-4 font-display font-semibold text-base">{t("emptyState")}</h2>
            <Button className="mt-5" leftIcon={<Plus size={16} />} onClick={() => navigate("/documents")}>
              {t("generate")}
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {docs.map((d) => (
              <li key={d.id} className="ls-card p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <FileText size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-sm truncate">{d.title}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{new Date(d.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Button variant="secondary" className="h-9 text-xs px-3">{t("downloadPdf")}</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ScreenShell>
  );
};

export default SavedDocuments;
