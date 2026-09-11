export type SessionStatus = "closed" | "open" | "ended";
export type TokenStatus = "waiting" | "called" | "skipped" | "completed";
export type NotificationType = "ten_ahead" | "five_ahead" | "three_ahead" | "next" | "called";
export type NotificationStatus = "pending" | "sent" | "delivered" | "failed";

export interface QueueEntry {
  id: string;
  tokenNumber: number;
  patientName: string;
  phone: string;
  status: TokenStatus;
  priority: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationRecord {
  id: string;
  entryId: string;
  type: NotificationType;
  status: NotificationStatus;
  message: string;
  createdAt: string;
}

export interface QueueState {
  sessionId: string;
  sessionDate: string;
  clinicName: string;
  status: SessionStatus;
  acceptingTokens: boolean;
  nextTokenNumber: number;
  entries: QueueEntry[];
  notifications: NotificationRecord[];
  activity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  label: string;
  detail: string;
  time: string;
  tone: "green" | "blue" | "amber" | "slate";
}

export interface JoinInput {
  patientName: string;
  phone: string;
  assisted: boolean;
}
