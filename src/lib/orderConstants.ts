export const ORDER_STATUSES = [
  "pending",
  "in_progress",
  "waiting_documents",
  "under_review",
  "completed",
  "delivered",
  "closed",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  waiting_documents: "Waiting for Documents",
  under_review: "Under Review",
  completed: "Completed",
  delivered: "Delivered",
  closed: "Closed",
  cancelled: "Cancelled",
};

export const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-500/10 text-blue-600",
  waiting_documents: "bg-yellow-500/10 text-yellow-700",
  under_review: "bg-purple-500/10 text-purple-600",
  completed: "bg-green-500/10 text-green-600",
  delivered: "bg-emerald-500/10 text-emerald-600",
  closed: "bg-zinc-500/10 text-zinc-600",
  cancelled: "bg-red-500/10 text-red-600",
};

export const STAGE_STATUSES = ["pending", "in_progress", "done", "blocked"] as const;
export type StageStatus = (typeof STAGE_STATUSES)[number];

export const DEFAULT_STAGES = [
  "LLC Formation",
  "EIN Registration",
  "Seller Central Setup",
  "Listing Creation",
  "Launch",
];
