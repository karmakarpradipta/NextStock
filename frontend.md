# NextStock — Frontend Implementation Guide

> This guide covers every module, page, component, API integration, and PDF/CSV export pattern for the NextStock frontend. Authentication is excluded.

---

## Tech Stack

| Library | Purpose |
|--------|---------|
| React 18 | UI framework |
| React Router v6 | Routing |
| Zustand | Global state (auth token, user) |
| TanStack Query | Server state, caching, refetching |
| Axios | HTTP client |
| React Hook Form + Zod | Forms and validation |
| Chart.js / Recharts | Dashboard charts |
| Tailwind CSS | Styling |
| react-hot-toast | Notifications |

---

## Folder Structure

```
src/
├── api/               # Axios instances + API functions per module
├── components/        # Shared UI components
│   ├── ui/            # Button, Input, Badge, Modal, Table, Pagination
│   ├── layout/        # Sidebar, Navbar, PageWrapper
│   └── shared/        # StatusBadge, LowStockBadge, EmptyState, LoadingSpinner
├── pages/             # One folder per module
│   ├── dashboard/
│   ├── users/
│   ├── categories/
│   ├── products/
│   ├── stock/
│   ├── vendors/
│   ├── purchases/
│   ├── sales/
│   └── reports/
├── hooks/             # Custom hooks (useDebounce, usePagination)
├── store/             # Zustand stores
├── utils/             # formatCurrency, formatDate, downloadFile
└── routes/            # Protected route wrappers
```

---

## Axios Setup

### `src/api/axios.js`

```js
import axios from "axios";
import useAuthStore from "../store/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true, // sends HttpOnly refresh token cookie
});

// attach access token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        useAuthStore.getState().setAccessToken(data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## Zustand Auth Store

### `src/store/authStore.js`

```js
import { create } from "zustand";

const useAuthStore = create((set) => ({
  accessToken: null,
  user: null,
  setAccessToken: (token) => set({ accessToken: token }),
  setUser: (user) => set({ user }),
  logout: () => set({ accessToken: null, user: null }),
}));

export default useAuthStore;
```

---

## Utility Functions

### `src/utils/formatters.js`

```js
export const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);

export const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export const formatDateTime = (date) =>
  new Date(date).toLocaleString("en-IN");
```

### `src/utils/downloadFile.js`

```js
// For CSV — backend streams the file directly
export const downloadCSV = async (url, filename) => {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
    },
  });
  const blob = await response.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

// For PDF — backend streams the file directly
export const downloadPDF = async (url, filename) => {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
    },
  });
  const blob = await response.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.pdf`;
  link.click();
  URL.revokeObjectURL(link.href);
};
```

> **Important:** Never use `api.get()` for PDF/CSV exports. The backend streams binary data, so use native `fetch()` and convert the response to a `Blob`. Axios does not handle streamed binary downloads cleanly without extra config.

---

## Pages & Components Per Module

---

### 1. Dashboard (`/dashboard`)

**API:** `GET /api/reports/dashboard`

**Layout:** Bento-style grid

**Cards to show:**
- Total Products
- Total Vendors
- Total Categories
- Low Stock Count (clickable — links to low stock report)
- Today's Sales (count + total amount)
- Today's Purchases (count + total amount)
- Outstanding Receivables
- Outstanding Payables

**Charts:**
- Purchase vs Sales bar chart — `GET /api/reports/purchase-vs-sales`
- Top 5 selling products bar chart — `GET /api/reports/top-selling?limit=5`

**Low stock alert banner:** If `lowStockCount > 0`, show a yellow warning banner at the top.

---

### 2. User Management (`/users`) — Admin only

**Pages:**
- `UserListPage` — table of all users
- `CreateUserModal` — inline modal form
- `EditUserModal` — inline modal form

**API calls:**
```
GET    /api/users
POST   /api/users
PUT    /api/users/:id
PATCH  /api/users/:id/toggle-status
PATCH  /api/users/:id/reset-password
```

**Table columns:** Name, Email, Role, Status (Active/Inactive badge), Created At, Actions

**Actions per row:** Edit, Toggle Status, Reset Password

**Notes:**
- Role dropdown: ADMIN / STAFF
- Toggle status shows confirmation dialog before calling API
- Reset password opens a small modal with just a new password field

---

### 3. Category Management (`/categories`)

**Pages:**
- `CategoryListPage` — table with inline add/edit

**API calls:**
```
GET    /api/categories
POST   /api/categories
PUT    /api/categories/:id
DELETE /api/categories/:id
```

**Table columns:** Name, Product Count, Status, Actions

**Notes:**
- Delete button disabled if product count > 0 — show tooltip "Cannot delete category with linked products"
- Status toggle inline in table row

---

### 4. Product Management (`/products`)

**Pages:**
- `ProductListPage` — paginated table with search + filters
- `ProductDetailPage` — full product view
- `CreateProductPage` — full page form
- `EditProductPage` — full page form

**API calls:**
```
GET    /api/products?page=&limit=&search=&categoryId=&isActive=&lowStock=
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
GET    /api/stock/:productId/current
GET    /api/stock/:productId?page=&limit=
```

**ProductListPage filters:**
- Search input (debounced 300ms) — searches name + SKU
- Category dropdown filter
- Status filter (Active / Inactive / All)
- Low Stock toggle filter

**Table columns:** Image, Name, SKU, Category, Unit, Current Stock, Min Threshold, Low Stock Badge, Status, Actions

**Low Stock Badge:** Red badge shown when `isLowStock === true`

**ProductDetailPage sections:**
1. Header — image, name, SKU, status badge, low stock badge, category, unit
2. Stock Card — current stock (large number), min threshold, stock health bar
3. Stock Movement History table — paginated, filterable by type (IN/OUT/ADJUSTMENT)

**CreateProductPage form fields:**
- Name (required)
- Category (dropdown — fetch from `/api/categories`)
- Unit (dropdown: kg, pcs, litre, box, packet, dozen, metre — or free text)
- Min Stock Threshold (number)
- Description (textarea)
- Image URL (text input — paste Cloudinary URL)
- SKU — show "Auto-generated" placeholder, allow override
- Status toggle

---

### 5. Stock Management (`/stock`)

**Pages:**
- No separate list page needed — stock is shown inside ProductDetailPage
- `StockAdjustmentModal` — triggered from product detail page

**API calls:**
```
POST /api/stock         — add movement (IN / OUT / ADJUSTMENT)
GET  /api/stock/:productId
GET  /api/stock/:productId/current
```

**StockAdjustmentModal fields:**
- Type (IN / OUT / ADJUSTMENT)
- Quantity (number — can be negative for ADJUSTMENT)
- Note (text — reason for adjustment)

**Notes:**
- OUT type — frontend should show current stock and warn if quantity entered exceeds it
- ADJUSTMENT — allow negative numbers, add helper text "Use negative value to reduce stock"

---

### 6. Vendor Management (`/vendors`)

**Pages:**
- `VendorListPage` — paginated table with search + filter
- `VendorDetailPage` — full vendor profile
- `CreateVendorPage`
- `EditVendorPage`

**API calls:**
```
GET    /api/vendors?page=&limit=&search=&isActive=
GET    /api/vendors/:id
POST   /api/vendors
PUT    /api/vendors/:id
DELETE /api/vendors/:id
POST   /api/vendors/:id/products       — map products
DELETE /api/vendors/:id/products/:productId — unmap product
```

**VendorListPage table columns:** Name, Contact Person, Email, Phone, Order Count, Product Count, Status, Actions

**VendorDetailPage sections:**
1. Profile card — name, contact, email, phone, address, GST number, status
2. Performance card — Order Count, Total Ordered, Total Paid, Outstanding Balance, On-Time Delivery Rate %
3. Mapped Products — list with remove button + Add Products button (multi-select modal)
4. Recent Orders — last 5 purchase orders table

**Map Products Modal:**
- Searchable multi-select of all active products
- Submit maps selected products to vendor via `POST /api/vendors/:id/products`

---

### 7. Purchase Management (`/purchases`)

**Pages:**
- `PurchaseListPage` — paginated table
- `PurchaseDetailPage`
- `CreatePurchasePage`
- `EditPurchasePage` — only accessible if status is DRAFT

**API calls:**
```
GET    /api/purchases?page=&limit=&search=&vendorId=&status=&paymentStatus=&from=&to=
GET    /api/purchases/:id
POST   /api/purchases
PUT    /api/purchases/:id
PATCH  /api/purchases/:id/confirm
PATCH  /api/purchases/:id/cancel
PATCH  /api/purchases/:id/payment
```

**PurchaseListPage filters:** Search, Vendor dropdown, Status, Payment Status, Date range (from/to)

**Table columns:** Order No, Vendor, Status Badge, Payment Status Badge, Total Amount, Paid, Outstanding, Date, Actions

**Status badge colors:**
- DRAFT — gray
- CONFIRMED — blue
- DELIVERED — green
- CANCELLED — red

**Payment status badge colors:**
- PENDING — yellow
- PARTIAL — orange
- PAID — green

**CreatePurchasePage form:**
1. Select Vendor (searchable dropdown)
2. Expected Delivery date
3. Purchase Date
4. Invoice URL (paste Cloudinary URL)
5. Notes
6. Items table — dynamic rows:
   - Product (searchable dropdown — active products only)
   - Quantity
   - Unit Price
   - Total (auto-calculated, read-only)
   - Remove row button
   - Add Item button

**Auto-calculate:** Total amount = sum of all item totals, shown at bottom.

**PurchaseDetailPage:**
- Order details header
- Vendor info
- Items table
- Payment section — current paid amount, update payment button
- Action buttons: Confirm (if DRAFT), Cancel, Edit (if DRAFT)

**Confirm/Cancel:** Show confirmation dialog before calling API.

---

### 8. Sales Management (`/sales`)

**Pages:**
- `SalesListPage`
- `SaleDetailPage`
- `CreateSalePage`
- `EditSalePage` — only if status is DRAFT

**API calls:**
```
GET    /api/sales?page=&limit=&search=&status=&paymentStatus=&from=&to=
GET    /api/sales/:id
POST   /api/sales
PUT    /api/sales/:id
PATCH  /api/sales/:id/confirm
PATCH  /api/sales/:id/cancel
PATCH  /api/sales/:id/payment
```

**Same patterns as Purchase Management** — same filters, same status badges, same items table pattern.

**Extra in CreateSalePage:**
- Customer Name, Phone, Email fields (all optional — for walk-in customers)

**SaleDetailPage:**
- Invoice header (print-friendly section — see PDF section below)
- Customer details
- Items table
- Payment section
- Action buttons

---

### 9. Reports (`/reports`)

**Pages:**
- `DashboardReportPage` (same as `/dashboard`)
- `LowStockReportPage`
- `StockSummaryReportPage`
- `DailyStockReportPage`
- `MonthlyStockReportPage`
- `PurchaseReportPage`
- `SalesReportPage`
- `PurchaseVsSalesReportPage`
- `VendorPurchaseReportPage`
- `ProfitReportPage`
- `LedgerReportPage`
- `TopSellingReportPage`

**Every report page has the same layout:**
1. Filter bar at top (date range, dropdowns)
2. Summary cards (totals, counts)
3. Data table
4. Export buttons — **Export CSV** and **Export PDF**

---

## PDF & CSV Export — Complete Guide

### How it works

The backend generates the file and **streams it directly** to the client. The frontend must:
1. Call the endpoint with `?export=csv` or `?export=pdf`
2. Receive the binary stream
3. Convert to a `Blob`
4. Trigger a browser download

### The downloadFile utility (use this everywhere)

```js
// src/utils/downloadFile.js
import useAuthStore from "../store/authStore";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const downloadReport = async (endpoint, filename, format = "pdf") => {
  try {
    const token = useAuthStore.getState().accessToken;
    const response = await fetch(`${BASE_URL}${endpoint}?export=${format}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Export failed");

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Download failed:", err);
    toast.error("Export failed. Please try again.");
  }
};
```

### Export button component

```jsx
// src/components/shared/ExportButtons.jsx
import { downloadReport } from "../../utils/downloadFile";
import { useState } from "react";

const ExportButtons = ({ endpoint, filename }) => {
  const [loading, setLoading] = useState(null);

  const handleExport = async (format) => {
    setLoading(format);
    await downloadReport(endpoint, filename, format);
    setLoading(null);
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleExport("csv")}
        disabled={loading === "csv"}
        className="btn btn-outline btn-sm"
      >
        {loading === "csv" ? "Exporting..." : "Export CSV"}
      </button>
      <button
        onClick={() => handleExport("pdf")}
        disabled={loading === "pdf"}
        className="btn btn-outline btn-sm"
      >
        {loading === "pdf" ? "Exporting..." : "Export PDF"}
      </button>
    </div>
  );
};

export default ExportButtons;
```

### How to use ExportButtons on a report page

```jsx
// Example: LowStockReportPage.jsx
import ExportButtons from "../../components/shared/ExportButtons";

const LowStockReportPage = () => {
  // ... fetch data with TanStack Query

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1>Low Stock Report</h1>
        <ExportButtons
          endpoint="/reports/low-stock"
          filename="low-stock-report"
        />
      </div>
      {/* table */}
    </div>
  );
};
```

### Report endpoints with their filter query params for export

When filters are applied on the page, pass them to the export URL too:

```js
// Example: Purchase Report with filters
const handleExport = async (format) => {
  const params = new URLSearchParams({
    export: format,
    ...(vendorId && { vendorId }),
    ...(from && { from }),
    ...(to && { to }),
  });

  await downloadReport(`/reports/purchases?${params.toString()}`, "purchase-report", format);
};
```

> **Note:** The `downloadReport` utility above already appends `?export=format` — if you have other filters, build the full query string yourself and pass the full endpoint path.

Updated utility for filtered exports:

```js
export const downloadFilteredReport = async (fullEndpointWithParams, filename, format) => {
  const token = useAuthStore.getState().accessToken;
  const separator = fullEndpointWithParams.includes("?") ? "&" : "?";
  const url = `${BASE_URL}${fullEndpointWithParams}${separator}export=${format}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error("Export failed");

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = `${filename}.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
};
```

---

## Sales Invoice — Print View

For the sale detail page, add a print-friendly invoice layout:

```jsx
// Inside SaleDetailPage.jsx
const handlePrint = () => window.print();

// Add print styles in index.css
// @media print {
//   .no-print { display: none; }
//   .print-only { display: block; }
// }
```

The invoice section should have:
- Company name / logo at top
- Invoice number, date
- Customer details
- Items table (product, qty, unit price, total)
- Subtotal, tax (if any), grand total
- Payment status

Wrap it in a `print-only` div and hide everything else on print.

---

## TanStack Query — API Functions Pattern

### `src/api/products.js`

```js
import api from "./axios";

export const getProducts = (params) => api.get("/products", { params }).then(r => r.data);
export const getProductById = (id) => api.get(`/products/${id}`).then(r => r.data);
export const createProduct = (data) => api.post("/products", data).then(r => r.data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data).then(r => r.data);
export const deleteProduct = (id) => api.delete(`/products/${id}`).then(r => r.data);
```

### Usage in component

```jsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProducts, deleteProduct } from "../../api/products";

const ProductListPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useQuery({
    queryKey: ["products", page, debouncedSearch],
    queryFn: () => getProducts({ page, limit: 10, search: debouncedSearch }),
  });

  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries(["products"]);
      toast.success("Product deleted");
    },
  });

  // ...
};
```

---

## Routing Structure

```jsx
// src/routes/AppRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<ProtectedRoute />}>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/products" element={<ProductListPage />} />
      <Route path="/products/:id" element={<ProductDetailPage />} />
      <Route path="/products/new" element={<CreateProductPage />} />
      <Route path="/products/:id/edit" element={<EditProductPage />} />
      <Route path="/categories" element={<CategoryListPage />} />
      <Route path="/vendors" element={<VendorListPage />} />
      <Route path="/vendors/:id" element={<VendorDetailPage />} />
      <Route path="/vendors/new" element={<CreateVendorPage />} />
      <Route path="/purchases" element={<PurchaseListPage />} />
      <Route path="/purchases/:id" element={<PurchaseDetailPage />} />
      <Route path="/purchases/new" element={<CreatePurchasePage />} />
      <Route path="/sales" element={<SalesListPage />} />
      <Route path="/sales/:id" element={<SaleDetailPage />} />
      <Route path="/sales/new" element={<CreateSalePage />} />
      <Route path="/reports/low-stock" element={<LowStockReportPage />} />
      <Route path="/reports/stock-summary" element={<StockSummaryReportPage />} />
      <Route path="/reports/stock-daily" element={<DailyStockReportPage />} />
      <Route path="/reports/stock-monthly" element={<MonthlyStockReportPage />} />
      <Route path="/reports/purchases" element={<PurchaseReportPage />} />
      <Route path="/reports/sales" element={<SalesReportPage />} />
      <Route path="/reports/purchase-vs-sales" element={<PurchaseVsSalesReportPage />} />
      <Route path="/reports/vendor-purchases" element={<VendorPurchaseReportPage />} />
      <Route path="/reports/profit" element={<ProfitReportPage />} />
      <Route path="/reports/ledger" element={<LedgerReportPage />} />
      <Route path="/reports/top-selling" element={<TopSellingReportPage />} />
      <Route element={<AdminRoute />}>
        <Route path="/users" element={<UserListPage />} />
      </Route>
    </Route>
  </Routes>
);
```

---

## Sidebar Navigation Structure

```
Dashboard
─────────────
Products
  └── Categories
Stock
─────────────
Vendors
Purchases
Sales
─────────────
Reports
  ├── Low Stock
  ├── Stock Summary
  ├── Daily Stock
  ├── Monthly Stock
  ├── Purchases
  ├── Sales
  ├── Purchase vs Sales
  ├── Vendor Purchases
  ├── Profit Estimation
  ├── Ledger
  └── Top Selling
─────────────
Users (Admin only)
```

---

## Environment Variables

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Key Rules to Follow

1. **Never use `api.get()` for PDF/CSV exports** — use native `fetch()` with Blob conversion
2. **Always pass `withCredentials: true`** on the Axios instance — required for refresh token cookie
3. **Debounce all search inputs** — 300ms minimum before firing API call
4. **Invalidate TanStack Query cache** after every mutation (create/update/delete)
5. **Show confirmation dialogs** before destructive actions (delete, cancel order, toggle status)
6. **Disable action buttons based on status** — e.g. Edit button hidden if order is not DRAFT
7. **Access token in Authorization header** — `Bearer <token>` on every protected request
8. **Filters should also apply to exports** — pass the same query params to the export URL
9. **Low stock badge** — always check `isLowStock` field from API and show red badge accordingly
10. **Role-based UI** — hide Admin-only actions (create/edit/delete) from STAFF users using `user.role === "ADMIN"` check from Zustand store
