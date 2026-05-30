import { useEffect, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, User, FileText, MessageSquare, Calendar, Settings, Scale, ShieldCheck, HelpCircle, Info, FileCheck2, LogOut, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/common/Button";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/i18n/translations";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface MenuItem {
  icon: ReactNode;
  labelKey: TranslationKey;
  route: string;
}

const ITEMS: MenuItem[] = [
  { icon: <Home size={20} />, labelKey: "navHome", route: "/home" },
  { icon: <User size={20} />, labelKey: "myProfile", route: "/profile" },
  { icon: <FileText size={20} />, labelKey: "myDocuments", route: "/documents" },
  { icon: <MessageSquare size={20} />, labelKey: "myCases", route: "/cases" },
  { icon: <Calendar size={20} />, labelKey: "appointmentHistory", route: "/profile/appointments" },
  { icon: <Settings size={20} />, labelKey: "preferences", route: "/profile" },
  { icon: <Scale size={20} />, labelKey: "savedLawyers", route: "/profile/saved-lawyers" },
  { icon: <ShieldCheck size={20} />, labelKey: "privacy", route: "/privacy" },
  { icon: <FileCheck2 size={20} />, labelKey: "terms", route: "/terms" },
  { icon: <Info size={20} />, labelKey: "about", route: "/about" },
  { icon: <HelpCircle size={20} />, labelKey: "helpSupport", route: "/profile/help" },
];

export const SideDrawer = ({ open, onClose }: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isGuest, guestName, profile, phone, logout } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const displayName = isGuest ? (guestName || t("guestUser")) : (profile.name || "User");
  const initials = displayName.trim().split(/\s+/).map((s) => s[0]).join("").slice(0, 2).toUpperCase() || "U";
  const subtitle = isGuest ? t("guestUser") : (profile.email || (phone ? `+91 ******${phone.slice(-4)}` : ""));

  const go = (route: string) => {
    onClose();
    window.setTimeout(() => navigate(route), 200);
  };

  const handleLogout = () => {
    logout();
    onClose();
    window.setTimeout(() => navigate("/language", { replace: true }), 200);
  };

  return (
    <div className="fixed inset-0 z-[70]">
      {/* Right-side dim overlay */}
      <button
        type="button"
        aria-label={t("close")}
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 animate-fade-in-up"
      />

      <aside
        role="dialog"
        aria-label="Menu"
        className="absolute top-0 left-0 h-full w-[82%] max-w-[320px] bg-card shadow-card animate-drawer-in flex flex-col"
      >
        {/* Header */}
        <div className="px-5 pt-[max(env(safe-area-inset-top),20px)] pb-4 bg-primary text-primary-foreground">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-14 h-14 rounded-full bg-primary-foreground/20 text-primary-foreground font-semibold text-lg flex items-center justify-center shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="font-display font-bold text-base truncate">{displayName}</p>
                <p className="text-xs opacity-90 truncate">{subtitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label={t("close")}
              className="w-9 h-9 rounded-full hover:bg-primary-foreground/10 flex items-center justify-center -mr-2 tap"
            >
              <X size={18} />
            </button>
          </div>

          {isGuest && (
            <Button
              variant="amber"
              fullWidth
              className="mt-4 h-10 text-xs"
              onClick={() => { onClose(); window.setTimeout(() => navigate("/login"), 200); }}
            >
              {t("signUpFullAccess")}
            </Button>
          )}
        </div>

        {/* Items */}
        <nav className="flex-1 overflow-y-auto py-2">
          {ITEMS.map((item) => {
            const active = location.pathname === item.route;
            return (
              <button
                key={item.labelKey + item.route}
                onClick={() => go(item.route)}
                className={cn(
                  "w-full flex items-center gap-3 px-5 py-3 text-left tap text-sm font-medium",
                  active
                    ? "bg-primary/8 border-l-4 border-primary text-primary"
                    : "text-foreground border-l-4 border-transparent"
                )}
              >
                <span className={cn("text-primary", active && "text-primary")}>{item.icon}</span>
                <span>{t(item.labelKey)}</span>
              </button>
            );
          })}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-5 py-3 text-left tap text-sm font-medium text-destructive border-l-4 border-transparent"
          >
            <LogOut size={20} />
            <span>{isAuthenticated || isGuest ? t("logout") : t("signUpFullAccess")}</span>
          </button>
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border text-center">
          <p className="text-[11px] font-semibold text-muted-foreground">{t("appVersion")}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{t("poweredBy")}</p>
        </div>
      </aside>
    </div>
  );
};
