import { apiSlice } from "../../api/apiSlice";

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  metadata: any;
  ipAddress: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "STAFF";
  };
}

export interface AuditFilters {
  page?: number;
  limit?: number;
  action?: string;
  entity?: string;
  userId?: string;
  from?: string;
  to?: string;
  search?: string;
}

export interface AuditLogResponse {
  success: boolean;
  logs: AuditLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const auditApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAuditLogs: builder.query<AuditLogResponse, AuditFilters>({
      query: (filters) => ({
        url: "/api/audit",
        params: filters,
      }),
      providesTags: ["Audit"],
    }),
    getUserAuditLogs: builder.query<AuditLogResponse, { userId: string; filters?: AuditFilters }>({
      query: ({ userId, filters }) => ({
        url: `/api/audit/user/${userId}`,
        params: filters,
      }),
    }),
  }),
});

export const { useGetAuditLogsQuery, useGetUserAuditLogsQuery } = auditApiSlice;
