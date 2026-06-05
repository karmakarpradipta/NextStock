import { apiSlice } from "../../api/apiSlice";

export interface StockMovement {
  id: string;
  type: "IN" | "OUT" | "ADJUSTMENT";
  quantity: number;
  note?: string;
  createdAt: string;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
}

export interface StockMovementsResponse {
  success: boolean;
  movements: StockMovement[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface StockMovementFilters {
  page?: number;
  limit?: number;
  type?: "IN" | "OUT" | "ADJUSTMENT";
}

export const stockApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getStockHistory: builder.query<StockMovementsResponse, { productId: string; params?: StockMovementFilters }>({
      query: ({ productId, params }) => ({
        url: `/api/stock/${productId}`,
        params,
      }),
      providesTags: (result, _error, { productId }) => 
        result 
          ? [...result.movements.map(({ id }) => ({ type: 'Stock' as const, id })), { type: 'Stock', id: `LIST-${productId}` }]
          : [{ type: 'Stock', id: `LIST-${productId}` }],
    }),
    addStockMovement: builder.mutation<StockMovement, { productId: string; type: string; quantity: number; note?: string }>({
      query: (data) => ({
        url: "/api/stock",
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: "Stock", id: `LIST-${productId}` },
        { type: "Product", id: productId },
        { type: "Product", id: "LIST" }
      ],
    }),
    getCurrentStock: builder.query<{ success: boolean; stock: any }, string>({
      query: (productId) => `/api/stock/${productId}/current`,
      providesTags: (_result, _error, id) => [{ type: 'Stock', id: `CURRENT-${id}` }],
    }),
  }),
});

export const {
  useGetStockHistoryQuery,
  useAddStockMovementMutation,
  useGetCurrentStockQuery,
} = stockApiSlice;
