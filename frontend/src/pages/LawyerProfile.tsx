import { useNavigate } from "react-router-dom";
import { ExternalLink, ArrowLeft, Scale } from "lucide-react";
import { ScreenShell } from "@/components/layout/ScreenShell";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { buildLawratoUrl } from "@/data/lawyers";

/**
 * LawyerProfile is no longer used for individual profiles (we redirect to Lawrato).
 * This page now acts as a soft landing that sends the user to the Lawyers directory.
 */
const LawyerProfile = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <ScreenShell>
      <StickyHeader title={t("findLawyer")} showBack />
      <div className="px-6 py-12 flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Scale size={28} className="text-primary" />
        </div>
        <h2 className="font-display font-bold text-lg">Find a Verified Lawyer</h2>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          Lawyer profiles are hosted on Lawrato.com — India's largest verified lawyer directory. Select your city and category to find the right lawyer.
        </p>
        <button
          onClick={() => navigate("/lawyers")}
          className="flex items-center gap-2 mt-2 h-11 px-6 rounded-button bg-primary text-primary-foreground font-semibold text-sm tap"
        >
          <ArrowLeft size={15} />
          Back to Lawyer Directory
        </button>
        <button
          onClick={() => window.open(buildLawratoUrl("bangalore"), "_blank", "noopener,noreferrer")}
          className="flex items-center gap-2 h-11 px-6 rounded-button border border-border text-sm font-medium tap"
        >
          <ExternalLink size={14} />
          Browse all lawyers on Lawrato
        </button>
      </div>
    </ScreenShell>
  );
};

export default LawyerProfile;
