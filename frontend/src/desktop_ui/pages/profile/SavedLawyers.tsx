import { Bookmark } from "lucide-react";
import { ScreenShell } from "@desktop/components/layout/ScreenShell";
import { StickyHeader } from "@desktop/components/layout/StickyHeader";
import { useLanguage } from "@desktop/contexts/LanguageContext";

const SavedLawyers = () => {
  const { t } = useLanguage();
  return (
    <ScreenShell>
      <StickyHeader title={t("savedLawyers")} showBack showLanguagePill />
      <div className="px-8 pt-6 pb-10 max-w-4xl">
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Bookmark size={28} className="text-muted-foreground" />
          </div>
          <h2 className="mt-4 font-display font-semibold text-base">{t("emptyState")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">Bookmark lawyers from their profile to find them here.</p>
        </div>
      </div>
    </ScreenShell>
  );
};

export default SavedLawyers;
