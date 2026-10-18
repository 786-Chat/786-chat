export type Role = "company-owner" | "sales-manager" | "sales-agent" | "read-only-auditor";

export interface Company {
  id: string;
  name: string;
  created_at: string;
}

export interface User {
  id: string;
  company_id: string;
  email: string;
  role: Role;
}

export interface Customer {
  id: string;
  company_id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
}

export interface Contact {
  id: string;
  customer_id: string;
  name: string;
  email: string;
  phone: string;
}

export interface Opportunity {
  id: string;
  company_id: string;
  customer_id: string;
  stage: "qualification" | "proposal" | "negotiation" | "closed_won" | "closed_lost";
  value: number;
  campaign: string;
  created_at: string;
}

export interface Activity {
  id: string;
  company_id: string;
  customer_id: string;
  type: "follow-up" | "call" | "email" | "meeting";
  description: string;
  due_date: string;
  completed: boolean;
  created_at: string;
}

export interface Task {
  id: string;
  company_id: string;
  activity_id: string;
  assigned_to: string;
  status: "pending" | "done";
}

export interface AuditLog {
  id: string;
  company_id: string;
  user_id: string;
  action: string;
  entity: string;
  entity_id: string;
  timestamp: string;
}
