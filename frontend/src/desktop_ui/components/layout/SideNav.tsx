import { Home, Briefcase, FileText, Scale, Users, MessageCircle, Bell, User, Settings, LogOut, ShieldCheck, HelpCircle, Info, Calendar, Bookmark, FileCheck2, Crown } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useLanguage } from "@desktop/contexts/LanguageContext";
import { useAuth } from "@desktop/contexts/AuthContext";
import { useNotifications } from "@desktop/contexts/NotificationContext";
import { usePremium } from "@desktop/contexts/PremiumContext";
import { cn } from "@desktop/lib/utils";

export const SideNav = () => {
  const { t } = useLanguage();
  const { profile, isGuest, guestName, logout, isPremium } = useAuth();
  const { unreadCount } = useNotifications();
  const { show } = usePremium();
  const navigate = useNavigate();

  const displayName = isGuest ? (guestName || t("guestUser")) : (profile.name || "User");
  const initials = displayName.trim().split(/\s+/).map((s: string) => s[0]).join("").slice(0, 2).toUpperCase() || "U";

  const primaryItems = [
    { to: "/home", label: t("navHome"), Icon: Home },
    { to: "/cases", label: t("navCases"), Icon: Briefcase },
    { to: "/documents", label: t("navDocs"), Icon: FileText },
    { to: "/lawyers", label: t("navLawyers"), Icon: Scale },
    { to: "/chat", label: t("aiChatbot"), Icon: MessageCircle },
  ];

  const secondaryItems = [
    { to: "/notifications", label: t("notifications"), Icon: Bell, badge: unreadCount },
    { to: "/profile", label: t("myProfile"), Icon: User },
    { to: "/profile/appointments", label: t("appointmentHistory"), Icon: Calendar },
    { to: "/profile/saved-lawyers", label: t("savedLawyers"), Icon: Bookmark },
    { to: "/profile/saved-documents", label: t("savedDocuments"), Icon: FileCheck2 },
    { to: "/profile/help", label: t("helpSupport"), Icon: HelpCircle },
    { to: "/about", label: t("about"), Icon: Info },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex flex-col z-30 shadow-card">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Scale size={16} className="text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-[17px] text-primary">LegalSarathi</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 font-medium tracking-wide">Your Law · Your Language</p>
      </div>

      {/* User profile mini */}
      <div className="px-4 py-3 border-b border-border">
        <button
          onClick={() => navigate("/profile")}
          className="w-full flex items-center gap-3 rounded-xl hover:bg-muted p-2 transition-colors tap text-left"
        >
          <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground font-semibold text-xs flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{displayName}</p>
            <p className="text-[10px] text-muted-foreground">{isGuest ? t("guestUser") : "View profile"}</p>
          </div>
        </button>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">Main</p>
        {primaryItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors tap",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} strokeWidth={isActive ? 2.4 : 1.8} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}

        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 pt-4 pb-2">Account</p>
        {secondaryItems.map(({ to, label, Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors tap",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <Icon size={18} strokeWidth={1.8} />
            <span className="flex-1">{label}</span>
            {badge && badge > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                {badge > 9 ? "9+" : badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Premium upsell */}
      {!isPremium && (
        <div className="px-3 py-2">
          <button
            onClick={() => show("premium_feature")}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-accent/10 border border-accent/20 text-left tap hover:bg-accent/15 transition-colors"
          >
            <Crown size={16} className="text-accent shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-accent truncate">Upgrade to Premium</p>
              <p className="text-[10px] text-muted-foreground">Unlock unlimited access</p>
            </div>
          </button>
        </div>
      )}

      {/* Logout */}
      <div className="px-3 pb-4 border-t border-border pt-2">
        <button
          onClick={() => { logout(); navigate("/login", { replace: true }); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors tap"
        >
          <LogOut size={18} strokeWidth={1.8} />
          <span>{t("logout")}</span>
        </button>
        <p className="text-[10px] text-muted-foreground text-center mt-2">{t("appVersion")}</p>
      </div>
    </aside>
  );
};
