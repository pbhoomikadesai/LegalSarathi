import { Bell, FileText, MessageCircle, Scale, Calendar, Inbox } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScreenShell } from "@desktop/components/layout/ScreenShell";
import { StickyHeader } from "@desktop/components/layout/StickyHeader";
import { useLanguage } from "@desktop/contexts/LanguageContext";
import { useNotifications, type AppNotification, type NotificationType } from "@desktop/contexts/NotificationContext";
import { cn } from "@desktop/lib/utils";

const ICONS = {
  document: FileText,
  lawyer: Scale,
  community: MessageCircle,
  law_update: Bell,
  booking: Calendar,
} as const satisfies Record<NotificationType, unknown>;

const Notifications = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { items, markRead, markAllRead, unreadCount } = useNotifications();

  const today = items.filter((n) => n.group === "today");
  const yest = items.filter((n) => n.group === "yesterday");
  const earlier = items.filter((n) => n.group === "earlier");

  const handleTap = (n: AppNotification) => {
    markRead(n.id);
    navigate(n.actionRoute);
  };

  return (
    <ScreenShell>
      <StickyHeader
        title={t("notifications")}
        showBack
        showLanguagePill
        rightAction={
          unreadCount > 0 ? (
            <button onClick={markAllRead} className="text-xs text-primary font-medium px-2 tap">
              {t("markAllRead")}
            </button>
          ) : undefined
        }
      />
      <div className="px-8 pt-6 pb-10 max-w-3xl">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Inbox size={32} />
            </div>
            <p className="mt-5 text-lg font-semibold">{t("allCaughtUp")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("noNotifications")}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {today.length > 0 && <Group title={t("today")} items={today} onTap={handleTap} />}
            {yest.length > 0 && <Group title={t("yesterday")} items={yest} onTap={handleTap} />}
            {earlier.length > 0 && <Group title={t("yesterday")} items={earlier} onTap={handleTap} />}
          </div>
        )}
      </div>
    </ScreenShell>
  );
};

const Group = ({ title, items, onTap }: { title: string; items: AppNotification[]; onTap: (n: AppNotification) => void }) => (
  <section>
    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{title}</h2>
    <div className="ls-card divide-y divide-border">
      {items.map((n) => {
        const Icon = ICONS[n.type];
        return (
          <button
            key={n.id}
            onClick={() => onTap(n)}
            className={cn("w-full flex items-start gap-4 px-5 py-4 text-left tap hover:bg-muted/50 transition-colors", !n.read && "bg-primary/3")}
          >
            <span className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", !n.read ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
              <Icon size={18} />
            </span>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm leading-snug", !n.read && "font-semibold")}>{n.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">{n.body}</p>
            </div>
            {!n.read && <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
          </button>
        );
      })}
    </div>
  </section>
);

export default Notifications;
