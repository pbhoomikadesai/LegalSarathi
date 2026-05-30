import { Bell, FileText, MessageCircle, Scale, Calendar, Inbox } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScreenShell } from "@/components/layout/ScreenShell";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotifications, type AppNotification, type NotificationType } from "@/contexts/NotificationContext";
import type { TranslationKey } from "@/i18n/translations";
import { cn } from "@/lib/utils";

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
      <div className="px-6 pt-4 pb-6 space-y-5">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Inbox size={28} />
            </div>
            <p className="mt-4 text-base font-semibold">{t("allCaughtUp")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("noNotifications")}</p>
          </div>
        ) : (
          <>
            {today.length > 0 && <Group title={t("today")} items={today} onTap={handleTap} />}
            {yest.length > 0 && <Group title={t("yesterday")} items={yest} onTap={handleTap} />}
            {earlier.length > 0 && <Group title={t("yesterday")} items={earlier} onTap={handleTap} />}
          </>
        )}
      </div>
    </ScreenShell>
  );
};

const Group = ({
  title,
  items,
  onTap,
}: {
  title: string;
  items: AppNotification[];
  onTap: (n: AppNotification) => void;
}) => {
  const { t } = useLanguage();
  return (
    <section>
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        {title}
      </h2>
      <div className="space-y-2">
        {items.map((n) => {
          const Icon = ICONS[n.type];
          return (
            <button
              key={n.id}
              onClick={() => onTap(n)}
              className={cn(
                "w-full text-left rounded-2xl border border-border p-3 flex gap-3 tap transition-colors",
                !n.read
                  ? "bg-primary/5 border-l-4 border-l-primary"
                  : "bg-card hover:bg-muted/50"
              )}
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight">
                  {t(n.titleKey as TranslationKey)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                  {t(n.descKey as TranslationKey)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">{n.time}</p>
              </div>
              {!n.read && (
                <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" aria-label="unread" />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default Notifications;
