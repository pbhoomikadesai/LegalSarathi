import { useState } from "react";
import { Bell, ChevronLeft, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LanguageSwitcherPill } from "@/components/language/LanguageSwitcherPill";
import { LanguageSwitcherSheet } from "@/components/language/LanguageSwitcherSheet";
import { SideDrawer } from "@/components/layout/SideDrawer";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import { useNotifications } from "@/contexts/NotificationContext";
import { cn } from "@/lib/utils";

interface Props {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showMenu?: boolean;
  showLanguagePill?: boolean;
  showBell?: boolean;
  showAvatar?: boolean;
  rightAction?: React.ReactNode;
  centerLogo?: boolean;
  className?: string;
}

export const StickyHeader = ({
  title,
  showBack,
  onBack,
  showMenu = false,
  showLanguagePill = false,
  showBell = false,
  showAvatar = false,
  rightAction,
  centerLogo = false,
  className,
}: Props) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border",
          className
        )}
      >
        <div className="flex items-center gap-2 px-4 h-14 max-w-md mx-auto">
          {showBack ? (
            <button
              onClick={() => (onBack ? onBack() : navigate(-1))}
              aria-label="Back"
              className="w-10 h-10 -ml-2 rounded-full hover:bg-muted flex items-center justify-center tap"
            >
              <ChevronLeft size={22} />
            </button>
          ) : showMenu ? (
            <button
              aria-label="Menu"
              onClick={() => setDrawerOpen(true)}
              className="w-10 h-10 -ml-2 rounded-full hover:bg-muted flex items-center justify-center tap"
            >
              <Menu size={22} />
            </button>
          ) : null}

          {centerLogo ? (
            <div className="flex-1 text-center font-display font-bold text-[17px] text-primary">
              LegalSarathi
            </div>
          ) : (
            <h1 className="flex-1 font-display font-bold text-[17px] truncate">
              {title ?? "LegalSarathi"}
            </h1>
          )}

          <div className="flex items-center gap-1.5">
            {showLanguagePill && <LanguageSwitcherPill onOpen={() => setSheetOpen(true)} />}
            {showBell && (
              <button
                aria-label="Notifications"
                onClick={() => setNotifOpen((v) => !v)}
                className="relative w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center tap"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            )}
            {showAvatar && (
              <button
                aria-label="Profile"
                onClick={() => navigate("/profile")}
                className="w-9 h-9 rounded-full bg-primary text-primary-foreground font-semibold text-xs flex items-center justify-center tap"
              >
                PD
              </button>
            )}
            {rightAction}
          </div>
        </div>
      </header>
      <LanguageSwitcherSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
};
