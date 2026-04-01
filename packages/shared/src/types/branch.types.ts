export interface BranchDto {
  id: string;
  tenantId: string;
  name: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateBranchRequest {
  name: string;
  address?: string;
  phone?: string;
}

export interface UpdateBranchRequest {
  name?: string;
  address?: string;
  phone?: string;
}
