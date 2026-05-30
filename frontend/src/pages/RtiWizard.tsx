import { CheckCircle2 } from "lucide-react";
import { ScreenShell } from "@/components/layout/ScreenShell";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { Button } from "@/components/common/Button";
import { useLanguage } from "@/contexts/LanguageContext";

const RtiWizard = () => {
  const { t } = useLanguage();
  return (
    <ScreenShell>
      <StickyHeader title={t("rtiTitle")} showBack showLanguagePill rightAction={<span className="text-xs text-muted-foreground">{t("step")} 3 {t("of")} 6</span>} />
      <div className="px-6 pt-4 pb-32 space-y-3">
        <DoneBubble q="First RTI?" a="Yes" />
        <DoneBubble q="Which state?" a="Karnataka" />
        <div className="ls-card p-4">
          <p className="text-sm font-medium">Which government department?</p>
          <input className="mt-3 w-full h-11 px-3 rounded-button border border-border bg-card text-sm outline-none focus:border-primary" placeholder="Search department..." />
          <ul className="mt-2 space-y-1">
            {["Revenue Department", "BBMP", "Health Department", "Education Department"].map((d) => (
              <li key={d}>
                <button className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-muted tap">{d}</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="fixed bottom-16 left-0 right-0 bg-card border-t border-border">
        <div className="max-w-md mx-auto px-4 py-3 flex gap-3">
          <Button variant="ghost" className="flex-1">{t("back")}</Button>
          <Button className="flex-1">{t("continue")}</Button>
        </div>
      </div>
    </ScreenShell>
  );
};

const DoneBubble = ({ q, a }: { q: string; a: string }) => (
  <div className="ls-card p-3 border-l-4 border-l-success">
    <p className="text-xs text-muted-foreground">{q}</p>
    <p className="text-sm font-medium inline-flex items-center gap-1.5 mt-0.5"><CheckCircle2 size={14} className="text-success" /> {a}</p>
  </div>
);

export default RtiWizard;
