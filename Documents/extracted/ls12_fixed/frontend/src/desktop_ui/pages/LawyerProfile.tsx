import { useNavigate } from "react-router-dom";
import { ExternalLink, ArrowLeft, Scale } from "lucide-react";
import { ScreenShell } from "@desktop/components/layout/ScreenShell";
import { StickyHeader } from "@desktop/components/layout/StickyHeader";
import { useLanguage } from "@desktop/contexts/LanguageContext";
import { buildLawratoUrl } from "@desktop/data/lawyers";

const LawyerProfile = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <ScreenShell>
      <StickyHeader title={t("findLawyer")} showBack />
      <div className="px-8 py-16 flex flex-col items-center text-center gap-5 max-w-lg mx-auto">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Scale size={36} className="text-primary" />
        </div>
        <h2 className="font-display font-bold text-xl">Find a Verified Lawyer</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Lawyer profiles are hosted on Lawrato.com — India's largest verified lawyer directory. Use the directory to filter by city and practice area.
        </p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => navigate("/lawyers")}
            className="flex items-center gap-2 h-11 px-6 rounded-button bg-primary text-primary-foreground font-semibold text-sm tap"
          >
            <ArrowLeft size={15} />
            Lawyer Directory
          </button>
          <button
            onClick={() => window.open(buildLawratoUrl("bangalore"), "_blank", "noopener,noreferrer")}
            className="flex items-center gap-2 h-11 px-6 rounded-button border border-border text-sm font-medium tap"
          >
            <ExternalLink size={14} />
            Browse on Lawrato
          </button>
        </div>
      </div>
    </ScreenShell>
  );
};

export default LawyerProfile;
