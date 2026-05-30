import { Home, Briefcase, FileText, Scale, Users } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export const BottomNav = () => {
  const { t } = useLanguage();

  // 5-tab navigation: Home · Cases · Documents · Lawyer · Community
  const items = [
    { to: "/home", label: t("navHome"), Icon: Home },
    { to: "/cases", label: t("navCases"), Icon: Briefcase },
    { to: "/documents", label: t("navDocs"), Icon: FileText },
    { to: "/lawyers", label: t("navLawyers"), Icon: Scale },
    { to: "/community", label: t("navCommunity"), Icon: Users },
  ];

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur border-t border-border"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 px-2 pt-2 pb-[max(env(safe-area-inset-bottom),8px)]">
        {items.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-1 py-1.5 rounded-lg tap min-w-[44px] min-h-[44px]",
                isActive ? "text-primary" : "text-muted-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.4 : 1.8}
                  fill={isActive ? "currentColor" : "none"}
                  fillOpacity={isActive ? 0.15 : 0}
                />
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
