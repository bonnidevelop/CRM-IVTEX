export const LEAD_SOURCES = [
  "website",
  "referral",
  "social_media",
  "email",
  "phone",
  "other",
] as const;

export type LeadSource = (typeof LEAD_SOURCES)[number];

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "unqualified",
  "converted",
  "lost",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_PRIORITIES = ["low", "medium", "high"] as const;

export type LeadPriority = (typeof LEAD_PRIORITIES)[number];

export const DEAL_STAGES = [
  "qualification",
  "discovery",
  "proposal",
  "negotiation",
  "won",
  "lost",
] as const;

export type DealStage = (typeof DEAL_STAGES)[number];

export const ACTIVITY_TYPES = [
  "call",
  "email",
  "meeting",
  "demo",
  "follow_up",
  "reminder",
  "note",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const ACTIVITY_STATUSES = [
  "pending",
  "completed",
  "overdue",
] as const;

export type ActivityStatus = (typeof ACTIVITY_STATUSES)[number];

export const ACTIVITY_ENTITY_TYPES = [
  "lead",
  "customer",
  "deal",
  "user",
] as const;

export type ActivityEntityType = (typeof ACTIVITY_ENTITY_TYPES)[number];

export const TIMELINE_ENTITY_TYPES = [
  "lead",
  "customer",
  "deal",
] as const;

export type TimelineEntityType = (typeof TIMELINE_ENTITY_TYPES)[number];

export const TIMELINE_ACTIONS = [
  "lead_created",
  "lead_assigned",
  "lead_reassigned",
  "lead_status_changed",
  "lead_priority_changed",
  "note_added",
  "follow_up_created",
  "follow_up_completed",
  "customer_created",
  "lead_converted",
  "deal_created",
  "deal_stage_changed",
  "deal_assigned",
  "deal_won",
  "deal_lost",
] as const;

export type TimelineAction = (typeof TIMELINE_ACTIONS)[number];
