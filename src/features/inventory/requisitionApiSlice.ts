import { apiSlice } from "../../api/apiSlice";

export type RequisitionStatus = "PENDING" | "APPROVED" | "REJECTED" | "ORDERED";

export interface Requisition {
  id: string;
  quantity: number;
  reason?: string;
  status: RequisitionStatus;
  rejectionNote?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  product: {
    id: string;
    name: string;
    sku: string;
    unit: string;
  };
  requester: {
    id: string;
    name: string;
    email: string;
  };
  reviewer?: {
    id: string;
    name: string;
  } | null;
}

export interface RequisitionFilters {
  page?: number;
  limit?: number;
  status?: string;
  productId?: string;
  search?: string;
}

export interface RequisitionResponse {
  success: boolean;
  requisitions: Requisition[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const requisitionApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRequisitions: builder.query<RequisitionResponse, RequisitionFilters>({
      query: (filters) => ({
        url: "/api/requisitions",
        params: filters,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.requisitions.map(({ id }) => ({ type: "Requisition" as const, id })),
              { type: "Requisition", id: "LIST" },
            ]
          : [{ type: "Requisition", id: "LIST" }],
    }),
    getApprovedRequisitions: builder.query<RequisitionResponse, void>({
      query: () => "/api/requisitions/approved",
      providesTags: [{ type: "Requisition", id: "APPROVED_LIST" }],
    }),
    getRequisition: builder.query<Requisition, string>({
      query: (id) => `/api/requisitions/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Requisition", id }],
    }),
    createRequisition: builder.mutation<Requisition, { productId: string; quantity: number; reason?: string }>({
      query: (body) => ({
        url: "/api/requisitions",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Requisition", id: "LIST" }],
    }),
    reviewRequisition: builder.mutation<Requisition, { id: string; action: "APPROVE" | "REJECT"; rejectionNote?: string }>({
      query: ({ id, ...body }) => ({
        url: `/api/requisitions/${id}/review`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Requisition", id: "LIST" },
        { type: "Requisition", id: "APPROVED_LIST" },
        { type: "Requisition", id },
      ],
    }),
    cancelRequisition: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/requisitions/${id}/cancel`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Requisition", id: "LIST" },
        { type: "Requisition", id },
      ],
    }),
  }),
});

export const {
  useGetRequisitionsQuery,
  useGetApprovedRequisitionsQuery,
  useGetRequisitionQuery,
  useCreateRequisitionMutation,
  useReviewRequisitionMutation,
  useCancelRequisitionMutation,
} = requisitionApiSlice;
