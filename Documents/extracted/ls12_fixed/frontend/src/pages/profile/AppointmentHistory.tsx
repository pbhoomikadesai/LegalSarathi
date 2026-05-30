import { Calendar } from "lucide-react";
import { ScreenShell } from "@/components/layout/ScreenShell";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { useLanguage } from "@/contexts/LanguageContext";

const AppointmentHistory = () => {
  const { t } = useLanguage();
  return (
    <ScreenShell>
      <StickyHeader title={t("appointmentHistory")} showBack showLanguagePill />
      <div className="px-6 pt-4 pb-8">
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Calendar size={28} className="text-muted-foreground" />
          </div>
          <h2 className="mt-4 font-display font-semibold text-base">{t("emptyState")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">Your past consultations will appear here.</p>
        </div>
      </div>
    </ScreenShell>
  );
};

export default AppointmentHistory;
