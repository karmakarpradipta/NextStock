import { apiSlice } from "../../api/apiSlice";

export type PurchaseStatus = "DRAFT" | "CONFIRMED" | "DELIVERED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "PARTIAL" | "PAID";

export interface PurchaseItem {
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

export interface Purchase {
  id: string;
  orderNumber: string;
  status: PurchaseStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  paidAmount: number;
  purchaseDate: string;
  expectedDelivery?: string;
  deliveredAt?: string;
  notes?: string;
  invoiceUrl?: string;
  vendor: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  items?: PurchaseItem[];
  _count?: {
    items: number;
  };
  createdAt: string;
}

export interface PurchaseFilters {
  page?: number;
  limit?: number;
  search?: string;
  vendorId?: string;
  status?: PurchaseStatus;
  paymentStatus?: PaymentStatus;
  from?: string;
  to?: string;
}

export interface PurchasesResponse {
  success: boolean;
  purchases: Purchase[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const purchaseApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPurchases: builder.query<PurchasesResponse, PurchaseFilters>({
      query: (params) => ({
        url: "/api/purchases",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.purchases.map(({ id }) => ({ type: "Purchase" as const, id })),
              { type: "Purchase", id: "LIST" },
            ]
          : [{ type: "Purchase", id: "LIST" }],
    }),
    getPurchase: builder.query<Purchase, string>({
      query: (id) => `/api/purchases/${id}`,
      transformResponse: (response: any) => response.purchase || response.data || response,
      providesTags: (_result, _error, id) => [{ type: "Purchase", id }],
    }),
    createPurchase: builder.mutation<Purchase, any>({
      query: (data) => ({
        url: "/api/purchases",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Purchase", id: "LIST" }],
    }),
    updatePurchase: builder.mutation<Purchase, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/api/purchases/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Purchase", id },
        { type: "Purchase", id: "LIST" },
      ],
    }),
    confirmPurchase: builder.mutation<Purchase, string>({
      query: (id) => ({
        url: `/api/purchases/${id}/confirm`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Purchase", id },
        { type: "Purchase", id: "LIST" },
        { type: "Product", id: "LIST" }, // Stock changes
      ],
    }),
    cancelPurchase: builder.mutation<Purchase, string>({
      query: (id) => ({
        url: `/api/purchases/${id}/cancel`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Purchase", id },
        { type: "Purchase", id: "LIST" },
        { type: "Product", id: "LIST" }, // Stock may reverse
      ],
    }),
    updatePurchasePayment: builder.mutation<Purchase, { id: string; paidAmount: number }>({
      query: ({ id, paidAmount }) => ({
        url: `/api/purchases/${id}/payment`,
        method: "PATCH",
        body: { paidAmount },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Purchase", id },
        { type: "Purchase", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetPurchasesQuery,
  useGetPurchaseQuery,
  useCreatePurchaseMutation,
  useUpdatePurchaseMutation,
  useConfirmPurchaseMutation,
  useCancelPurchaseMutation,
  useUpdatePurchasePaymentMutation,
} = purchaseApiSlice;
