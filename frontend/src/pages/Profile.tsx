import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, ChevronRight, Globe, Bell, FileText, Calendar, Bookmark, ShieldCheck, HelpCircle, Star, Info, LogOut, Moon, Crown } from "lucide-react";
import { ScreenShell } from "@/components/layout/ScreenShell";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { Button } from "@/components/common/Button";
import { LanguageSwitcherSheet } from "@/components/language/LanguageSwitcherSheet";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCases } from "@/contexts/CasesContext";
import { usePremium } from "@/contexts/PremiumContext";

const Profile = () => {
  const { t, meta } = useLanguage();
  const navigate = useNavigate();
  const { logout, phone, isGuest, guestName, profile, isPremium, theme, toggleTheme } = useAuth();
  const { cases } = useCases();
  const { show } = usePremium();
  const [langOpen, setLangOpen] = useState(false);
  const [notif, setNotif] = useState(true);

  const masked = phone ? `+91 ******${phone.slice(-4)}` : "";
  const displayName = isGuest ? (guestName || t("guestUser")) : (profile.name || "Priya Desai");
  const initials = displayName.trim().split(/\s+/).map((s) => s[0]).join("").slice(0, 2).toUpperCase() || "U";
  const docCount = cases.filter((c) => c.type === "document" || c.type === "rti").length;
  const queryCount = cases.filter((c) => c.type === "query").length;

  return (
    <ScreenShell>
      <StickyHeader title={t("myProfile")} showLanguagePill />
      <div className="px-6 pt-4 pb-8 space-y-5">
        <div className="ls-card p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground text-xl font-semibold flex items-center justify-center">{initials}</div>
              <button aria-label="Change photo" className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center">
                <Camera size={14} />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display font-bold text-base truncate">{displayName}</h2>
              <p className="text-xs text-muted-foreground truncate">{isGuest ? t("guestUser") : masked}</p>
              <Button variant="ghost" className="h-8 px-0 text-xs mt-1" onClick={() => navigate("/profile/edit")}>{t("editProfile")}</Button>
            </div>
          </div>
          <div className="grid grid-cols-3 mt-4 pt-4 border-t border-border text-center">
            <Stat n={docCount} l={t("documents")} />
            <Stat n={queryCount} l={t("queries")} />
            <Stat n={0} l={t("bookings")} />
          </div>
        </div>

        {!isPremium && (
          <button
            onClick={() => show("premium_feature")}
            className="w-full ls-card p-4 flex items-center gap-3 tap border-accent/40 bg-accent/5"
          >
            <span className="w-10 h-10 rounded-xl bg-accent text-accent-foreground flex items-center justify-center"><Crown size={18} /></span>
            <span className="flex-1 text-left">
              <p className="font-display font-bold text-sm">Upgrade to Premium</p>
              <p className="text-[11px] text-muted-foreground">Unlock unlimited everything</p>
            </span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        )}

        <Section title={t("preferences")}>
          <Row icon={<Globe size={18} />} label={t("language")} value={meta.native} onClick={() => setLangOpen(true)} />
          <ToggleRow icon={<Bell size={18} />} label={t("notifications")} on={notif} onChange={setNotif} />
          <ToggleRow icon={<Moon size={18} />} label={t("darkMode")} on={theme === "dark"} onChange={toggleTheme} />
        </Section>

        <Section title={t("legalProfile")}>
          <Row icon={<FileText size={18} />} label={t("savedDocuments")} onClick={() => navigate("/profile/saved-documents")} />
          <Row icon={<Calendar size={18} />} label={t("appointmentHistory")} onClick={() => navigate("/profile/appointments")} />
          <Row icon={<Bookmark size={18} />} label={t("savedLawyers")} onClick={() => navigate("/profile/saved-lawyers")} />
        </Section>

        <Section title={t("privacySecurity")}>
          <Row icon={<ShieldCheck size={18} />} label={t("privacyPolicy")} onClick={() => navigate("/profile/help")} />
        </Section>

        <Section title={t("helpSupport")}>
          <Row icon={<HelpCircle size={18} />} label={t("faqs")} onClick={() => navigate("/profile/help")} />
          <Row icon={<HelpCircle size={18} />} label={t("contactSupport")} onClick={() => navigate("/profile/help")} />
          <Row icon={<Star size={18} />} label="Rate app" onClick={() => navigate("/profile/help")} />
          <Row icon={<Info size={18} />} label="About LegalSarathi" onClick={() => navigate("/profile/help")} />
        </Section>

        <button
          onClick={() => { logout(); navigate("/login", { replace: true }); }}
          className="w-full inline-flex items-center justify-center gap-2 text-destructive font-semibold py-3 tap"
        >
          <LogOut size={18} /> {t("logout")}
        </button>
      </div>

      <LanguageSwitcherSheet open={langOpen} onClose={() => setLangOpen(false)} />
    </ScreenShell>
  );
};

const Stat = ({ n, l }: { n: number; l: string }) => (
  <div>
    <p className="font-display font-bold text-lg">{n}</p>
    <p className="text-[11px] text-muted-foreground">{l}</p>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section>
    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">{title}</h3>
    <div className="ls-card divide-y divide-border">{children}</div>
  </section>
);

const Row = ({ icon, label, value, onClick }: { icon: React.ReactNode; label: string; value?: string; onClick?: () => void }) => (
  <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3 text-left tap">
    <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground/70">{icon}</span>
    <span className="flex-1 text-sm font-medium">{label}</span>
    {value && <span className="text-xs text-muted-foreground font-native">{value}</span>}
    <ChevronRight size={16} className="text-muted-foreground" />
  </button>
);

const ToggleRow = ({ icon, label, on, onChange }: { icon: React.ReactNode; label: string; on: boolean; onChange: (v: boolean) => void }) => (
  <div className="w-full flex items-center gap-3 px-4 py-3">
    <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground/70">{icon}</span>
    <span className="flex-1 text-sm font-medium">{label}</span>
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`w-11 h-6 rounded-full transition-colors relative ${on ? "bg-primary" : "bg-border"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-card shadow transition-transform ${on ? "translate-x-5" : ""}`} />
    </button>
  </div>
);

export default Profile;
