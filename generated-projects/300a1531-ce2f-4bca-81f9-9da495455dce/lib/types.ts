export type Customer = {
  id: string;
  company_id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
};

export type Reservation = {
  id: string;
  company_id: string;
  customer_id: string;
  date: string;
  party_size: number;
  status: string;
  created_at: string;
};

export type Order = {
  id: string;
  company_id: string;
  customer_id: string;
  total: number;
  status: string;
  created_at: string;
};
