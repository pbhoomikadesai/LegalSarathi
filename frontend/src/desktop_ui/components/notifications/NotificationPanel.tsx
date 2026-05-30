import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, FileText, MessageCircle, Scale, Calendar } from "lucide-react";
import { useNotifications, type AppNotification, type NotificationType } from "@desktop/contexts/NotificationContext";
import { useLanguage } from "@desktop/contexts/LanguageContext";
import type { TranslationKey } from "@desktop/i18n/translations";
import { cn } from "@desktop/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  /** approximate offset from top so the panel sits below the header */
  topOffset?: number;
}

const ICONS = {
  document: FileText,
  lawyer: Scale,
  community: MessageCircle,
  law_update: Bell,
  booking: Calendar,
} as const satisfies Record<NotificationType, unknown>;

export const NotificationPanel = ({ open, onClose, topOffset = 56 }: Props) => {
  const { items, markRead, markAllRead, unreadCount } = useNotifications();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    // Defer attach so the opening click doesn't immediately close it
    const id = window.setTimeout(() => document.addEventListener("mousedown", onDoc), 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [open, onClose]);

  if (!open) return null;

  const recent = items.slice(0, 5);

  const handleTap = (n: AppNotification) => {
    markRead(n.id);
    onClose();
    navigate(n.actionRoute);
  };

  return (
    <div className="fixed inset-0 z-[60] pointer-events-none">
      <div
        ref={ref}
        style={{ top: topOffset }}
        className="pointer-events-auto absolute right-4 top-full mt-2 w-96 bg-card rounded-2xl shadow-card border border-border overflow-hidden animate-fade-in-up"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold font-display">
            {t("notifications")} {unreadCount > 0 && <span className="text-primary">({unreadCount})</span>}
          </h3>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-[11px] text-primary font-semibold tap">
              {t("markAllRead")}
            </button>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {recent.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              {t("noNotifications")}
            </div>
          ) : (
            recent.map((n) => {
              const Icon = ICONS[n.type];
              return (
                <button
                  key={n.id}
                  onClick={() => handleTap(n)}
                  className={cn(
                    "w-full flex items-start gap-3 px-4 py-3 text-left tap border-b border-border/50 last:border-b-0",
                    !n.read && "bg-primary/5 border-l-[3px] border-l-primary"
                  )}
                >
                  <span className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon size={16} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold leading-snug truncate">
                      {t(n.titleKey as TranslationKey)}
                    </span>
                    <span className="block text-[11px] text-muted-foreground leading-snug truncate mt-0.5">
                      {t(n.descKey as TranslationKey)}
                    </span>
                    <span className="block text-[10px] text-muted-foreground mt-0.5">{n.time}</span>
                  </span>
                </button>
              );
            })
          )}
        </div>

        <button
          onClick={() => { onClose(); navigate("/notifications"); }}
          className="w-full text-center text-xs text-primary font-semibold py-3 border-t border-border tap hover:bg-muted"
        >
          {t("viewAllNotifications")} →
        </button>
      </div>
    </div>
  );
};
