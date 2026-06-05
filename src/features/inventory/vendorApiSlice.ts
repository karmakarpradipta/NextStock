import { apiSlice } from "../../api/apiSlice";

export interface VendorPerformance {
  orderCount: number;
  totalOrdered: number;
  totalPaid: number;
  outstandingBalance: number;
  onTimeDeliveryRate: number;
}

export interface VendorProduct {
  product: {
    id: string;
    name: string;
    sku: string;
    unit: string;
    isActive: boolean;
  };
}

export interface Vendor {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    purchaseOrders: number;
    vendorProducts: number;
  };
  vendorProducts?: VendorProduct[];
  performance?: VendorPerformance;
  recentOrders?: any[]; // Simplified for now
}

export interface VendorFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: string | boolean;
}

export interface VendorsResponse {
  success: boolean;
  vendors: Vendor[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const vendorApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getVendors: builder.query<VendorsResponse, VendorFilters>({
      query: (params) => ({
        url: "/api/vendors",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.vendors.map(({ id }) => ({ type: "Vendor" as const, id })),
              { type: "Vendor", id: "LIST" },
            ]
          : [{ type: "Vendor", id: "LIST" }],
    }),
    getVendor: builder.query<Vendor, string>({
      query: (id) => `/api/vendors/${id}`,
      transformResponse: (response: any) => response.vendor || response.data || response,
      providesTags: (_result, _error, id) => [{ type: "Vendor", id }],
    }),
    createVendor: builder.mutation<Vendor, Partial<Vendor>>({
      query: (data) => ({
        url: "/api/vendors",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Vendor", id: "LIST" }],
    }),
    updateVendor: builder.mutation<Vendor, { id: string; data: Partial<Vendor> }>({
      query: ({ id, data }) => ({
        url: `/api/vendors/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Vendor", id },
        { type: "Vendor", id: "LIST" },
      ],
    }),
    deleteVendor: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/api/vendors/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Vendor", id: "LIST" }],
    }),
    mapProductsToVendor: builder.mutation<{ success: boolean }, { id: string; productIds: string[] }>({
      query: ({ id, productIds }) => ({
        url: `/api/vendors/${id}/products`,
        method: "POST",
        body: { productIds },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Vendor", id }],
    }),
    unmapProductFromVendor: builder.mutation<{ success: boolean }, { id: string; productId: string }>({
      query: ({ id, productId }) => ({
        url: `/api/vendors/${id}/products/${productId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Vendor", id }],
    }),
  }),
});

export const {
  useGetVendorsQuery,
  useGetVendorQuery,
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useDeleteVendorMutation,
  useMapProductsToVendorMutation,
  useUnmapProductFromVendorMutation,
} = vendorApiSlice;
