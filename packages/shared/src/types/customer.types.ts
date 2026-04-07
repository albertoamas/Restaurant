export interface CustomerDto {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  ticketsDelivered: number;
  notes: string | null;
  createdAt: string;
}

export interface CustomerStatsDto extends CustomerDto {
  purchaseCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
  ticketsDelivered: number;
}

export interface CustomerSearchResult {
  id: string;
  name: string;
  phone: string | null;
  purchaseCount: number;
}

export interface CreateCustomerRequest {
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
}

