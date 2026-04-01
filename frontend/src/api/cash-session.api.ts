import api from './client';
import type { CashSessionDto, OpenCashSessionRequest, CloseCashSessionRequest } from '@pos/shared';

function branchParam(branchId?: string | null) {
  return branchId ? { params: { branchId } } : {};
}

export const cashSessionApi = {
  getCurrent: (branchId?: string | null) =>
    api.get<CashSessionDto | null>('/api/v1/cash-sessions/current', branchParam(branchId)).then((r) => r.data),
  getHistory: (branchId?: string | null, limit = 20) =>
    api.get<CashSessionDto[]>('/api/v1/cash-sessions/history', {
      params: { ...(branchId ? { branchId } : {}), limit },
    }).then((r) => r.data),
  open: (data: OpenCashSessionRequest, branchId?: string | null) =>
    api.post<CashSessionDto>('/api/v1/cash-sessions/open', data, branchParam(branchId)).then((r) => r.data),
  close: (data: CloseCashSessionRequest, branchId?: string | null) =>
    api.post<CashSessionDto>('/api/v1/cash-sessions/close', data, branchParam(branchId)).then((r) => r.data),
};
