import { apiSlice } from "../../api/apiSlice";

export type SaleStatus = "DRAFT" | "CONFIRMED" | "CANCELLED";
export type SalePaymentStatus = "PENDING" | "PARTIAL" | "PAID";

export interface SaleItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: {
    id: string;
    name: string;
    sku: string;
    unit: string;
  };
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  status: SaleStatus;
  paymentStatus: SalePaymentStatus;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  totalAmount: number;
  paidAmount: number;
  saleDate: string;
  notes?: string;
  items?: SaleItem[];
  _count?: {
    items: number;
  };
  createdAt: string;
}

export interface SaleFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: SaleStatus;
  paymentStatus?: SalePaymentStatus;
  from?: string;
  to?: string;
}

export interface SalesResponse {
  success: boolean;
  sales: Sale[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const salesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSales: builder.query<SalesResponse, SaleFilters>({
      query: (params) => ({
        url: "/api/sales",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.sales.map(({ id }) => ({ type: "Sale" as const, id })),
              { type: "Sale", id: "LIST" },
            ]
          : [{ type: "Sale", id: "LIST" }],
    }),
    getSale: builder.query<Sale, string>({
      query: (id) => `/api/sales/${id}`,
      transformResponse: (response: any) => response.sale || response.data || response,
      providesTags: (_result, _error, id) => [{ type: "Sale", id }],
    }),
    createSale: builder.mutation<Sale, any>({
      query: (data) => ({
        url: "/api/sales",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Sale", id: "LIST" }],
    }),
    updateSale: builder.mutation<Sale, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/api/sales/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Sale", id },
        { type: "Sale", id: "LIST" },
      ],
    }),
    confirmSale: builder.mutation<Sale, string>({
      query: (id) => ({
        url: `/api/sales/${id}/confirm`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Sale", id },
        { type: "Sale", id: "LIST" },
        { type: "Product", id: "LIST" }, // Stock decreases
      ],
    }),
    cancelSale: builder.mutation<Sale, string>({
      query: (id) => ({
        url: `/api/sales/${id}/cancel`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Sale", id },
        { type: "Sale", id: "LIST" },
        { type: "Product", id: "LIST" }, // Stock may reverse
      ],
    }),
    updateSalePayment: builder.mutation<Sale, { id: string; paidAmount: number }>({
      query: ({ id, paidAmount }) => ({
        url: `/api/sales/${id}/payment`,
        method: "PATCH",
        body: { paidAmount },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Sale", id },
        { type: "Sale", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetSalesQuery,
  useGetSaleQuery,
  useCreateSaleMutation,
  useUpdateSaleMutation,
  useConfirmSaleMutation,
  useCancelSaleMutation,
  useUpdateSalePaymentMutation,
} = salesApiSlice;
