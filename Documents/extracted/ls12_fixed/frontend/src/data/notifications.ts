export type NotificationType = "doc" | "lawyer" | "community" | "law" | "appointment";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timeLabel: string;
  group: "today" | "yesterday";
  unread: boolean;
}

export const NOTIFICATIONS: AppNotification[] = [];
