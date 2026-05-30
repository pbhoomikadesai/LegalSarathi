import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, ChevronRight, Globe, Bell, FileText, Calendar, Bookmark, ShieldCheck, HelpCircle, Star, Info, LogOut, Moon, Crown } from "lucide-react";
import { ScreenShell } from "@desktop/components/layout/ScreenShell";
import { StickyHeader } from "@desktop/components/layout/StickyHeader";
import { Button } from "@desktop/components/common/Button";
import { LanguageSwitcherSheet } from "@desktop/components/language/LanguageSwitcherSheet";
import { useLanguage } from "@desktop/contexts/LanguageContext";
import { useAuth } from "@desktop/contexts/AuthContext";
import { useCases } from "@desktop/contexts/CasesContext";
import { usePremium } from "@desktop/contexts/PremiumContext";

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
  const initials = displayName.trim().split(/\s+/).map((s: string) => s[0]).join("").slice(0, 2).toUpperCase() || "U";
  const docCount = cases.filter((c) => c.type === "document" || c.type === "rti").length;
  const queryCount = cases.filter((c) => c.type === "query").length;

  return (
    <ScreenShell>
      <StickyHeader title={t("myProfile")} showLanguagePill />
      <div className="px-8 pt-6 pb-10 max-w-5xl">
        {/* Desktop 2-column layout */}
        <div className="grid grid-cols-3 gap-8">
          {/* Left: profile card + premium */}
          <div className="col-span-1 space-y-4">
            <div className="ls-card p-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground text-2xl font-semibold flex items-center justify-center">{initials}</div>
                  <button aria-label="Change photo" className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center shadow-sm">
                    <Camera size={14} />
                  </button>
                </div>
                <h2 className="font-display font-bold text-lg">{displayName}</h2>
                <p className="text-sm text-muted-foreground">{isGuest ? t("guestUser") : masked}</p>
                <Button variant="ghost" className="h-8 px-3 text-xs mt-2" onClick={() => navigate("/profile/edit")}>{t("editProfile")}</Button>
              </div>
              <div className="grid grid-cols-3 mt-5 pt-4 border-t border-border text-center">
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
                <span className="w-10 h-10 rounded-xl bg-accent text-accent-foreground flex items-center justify-center shrink-0"><Crown size={18} /></span>
                <span className="flex-1 text-left">
                  <p className="font-display font-bold text-sm">Upgrade to Premium</p>
                  <p className="text-[11px] text-muted-foreground">Unlock unlimited everything</p>
                </span>
                <ChevronRight size={16} className="text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Right: settings sections */}
          <div className="col-span-2 space-y-6">
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
              className="inline-flex items-center gap-2 text-destructive font-semibold py-2 tap text-sm"
            >
              <LogOut size={18} /> {t("logout")}
            </button>
          </div>
        </div>
      </div>

      <LanguageSwitcherSheet open={langOpen} onClose={() => setLangOpen(false)} />
    </ScreenShell>
  );
};

const Stat = ({ n, l }: { n: number; l: string }) => (
  <div>
    <p className="font-display font-bold text-xl">{n}</p>
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
  <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3.5 text-left tap hover:bg-muted/50 transition-colors">
    <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground/70">{icon}</span>
    <span className="flex-1 text-sm font-medium">{label}</span>
    {value && <span className="text-xs text-muted-foreground font-native">{value}</span>}
    <ChevronRight size={16} className="text-muted-foreground" />
  </button>
);

const ToggleRow = ({ icon, label, on, onChange }: { icon: React.ReactNode; label: string; on: boolean; onChange: (v: boolean) => void }) => (
  <div className="w-full flex items-center gap-3 px-4 py-3.5">
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
