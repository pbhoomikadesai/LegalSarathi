import { useState } from "react";
import { Bell, ChevronLeft, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LanguageSwitcherPill } from "@desktop/components/language/LanguageSwitcherPill";
import { LanguageSwitcherSheet } from "@desktop/components/language/LanguageSwitcherSheet";
import { NotificationPanel } from "@desktop/components/notifications/NotificationPanel";
import { useNotifications } from "@desktop/contexts/NotificationContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@desktop/lib/utils";

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
  showLanguagePill = false,
  showBell = false,
  showAvatar = false,
  rightAction,
  centerLogo = false,
  className,
}: Props) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const { profile, guestName, isGuest } = useAuth();

  // Calculate initials dynamically based on the current user's profile
  const getInitials = () => {
    const name = (profile.name && profile.name.trim()) || (isGuest && guestName) || "Priya";
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border",
          className
        )}
      >
        <div className="flex items-center gap-3 px-8 h-16">
          {showBack && (
            <button
              onClick={() => (onBack ? onBack() : navigate(-1))}
              aria-label="Back"
              className="w-9 h-9 rounded-lg hover:bg-muted flex items-center justify-center tap transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          <div className="flex-1">
            {centerLogo ? (
              <span className="font-display font-bold text-[18px] text-primary">LegalSarathi</span>
            ) : (
              <h1 className="font-display font-bold text-[18px] truncate">
                {title ?? "LegalSarathi"}
              </h1>
            )}
          </div>

          <div className="flex items-center gap-2">
            {showLanguagePill && <LanguageSwitcherPill onOpen={() => setSheetOpen(true)} />}

            {showBell && (
              <button
                aria-label="Notifications"
                onClick={() => setNotifOpen((v) => !v)}
                className="relative w-9 h-9 rounded-lg hover:bg-muted flex items-center justify-center tap transition-colors"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] px-0.5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
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
                {getInitials()}
              </button>
            )}
            {rightAction}
          </div>
        </div>
      </header>
      <LanguageSwitcherSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
};
