export type LeadStatus =
  | "NEW"
  | "QUALIFIED"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "DONE"
  | "LOST";

export type Lead = {
  id: string;
  tenant_id: string;
  name: string | null;
  phone: string;
  neighborhood: string | null;
  service_type: string | null;
  urgency: string | null;
  status: LeadStatus;
  handoff_human: boolean;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  tenant_id: string;
  conversation_id: string;
  direction: "inbound" | "outbound";
  body: string;
  wa_message_id: string | null;
  created_at: string;
};

export type Appointment = {
  id: string;
  tenant_id: string;
  lead_id: string;
  start_at: string;
  end_at: string | null;
  status: string;
  notes: string | null;
  created_at: string;
};
