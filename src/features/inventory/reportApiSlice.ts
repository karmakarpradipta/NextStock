import { apiSlice } from "../../api/apiSlice";

export interface DashboardStats {
  totalProducts: number;
  totalVendors: number;
  totalCategories: number;
  lowStockCount: number;
  todaySales: {
    count: number;
    total: number;
  };
  todayPurchases: {
    count: number;
    total: number;
  };
  outstandingReceivables: number;
  outstandingPayables: number;
}

export const reportApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<DashboardStats, void>({
      query: () => "/api/reports/dashboard",
      transformResponse: (response: any) => response.data,
      providesTags: ["Sale", "Purchase", "Product", "Vendor"],
    }),
    getLowStockReport: builder.query<any[], void>({
      query: () => "/api/reports/low-stock",
      transformResponse: (response: any) => response.data,
      providesTags: ["Product"],
    }),
    getPurchaseVsSales: builder.query<any[], { from?: string; to?: string }>({
      query: (params) => ({
        url: "/api/reports/purchase-vs-sales",
        params,
      }),
      transformResponse: (response: any) => response.data,
      providesTags: ["Sale", "Purchase"],
    }),
    getTopSelling: builder.query<any[], { limit?: number }>({
      query: (params) => ({
        url: "/api/reports/top-selling",
        params,
      }),
      transformResponse: (response: any) => response.data,
      providesTags: ["Sale"],
    }),
  }),
});

export const {
  useGetDashboardStatsQuery,
  useGetLowStockReportQuery,
  useGetPurchaseVsSalesQuery,
  useGetTopSellingQuery,
} = reportApiSlice;
