import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "../components/layouts/MainLayout";
import AuthLayout from "../components/layouts/AuthLayout";
import ProtectedRoute from "../components/common/ProtectedRoute";
import PublicRoute from "../components/common/PublicRoute";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Users from "../pages/Users";
import EditUser from "../pages/EditUser";
import Categories from "../pages/Categories";
import Inventory from "../pages/Inventory";
import Products from "../pages/Products";
import ProductForm from "../pages/ProductForm";
import ProductDetail from "../pages/ProductDetail";
import Purchases from "../pages/Purchases";
import PurchaseForm from "../pages/PurchaseForm";
import PurchaseDetail from "../pages/PurchaseDetail";
import Sales from "../pages/Sales";
import SaleForm from "../pages/SaleForm";
import SaleDetail from "../pages/SaleDetail";
import Vendors from "../pages/Vendors";
import VendorForm from "../pages/VendorForm";
import VendorDetail from "../pages/VendorDetail";
import Reports from "../pages/Reports";
import Profile from "../pages/Profile";
import NotFound from "../pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicRoute />,
    children: [
      {
        path: "/",
        element: <AuthLayout />,
        children: [
          { path: "login", element: <Login /> },
          { path: "/", element: <Navigate to="/login" replace /> },
        ],
      },
    ],
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <MainLayout />,
        children: [
          { path: "dashboard", element: <Dashboard /> },
          { 
            path: "inventory", 
            children: [
              { path: "categories", element: <Categories /> },
              { path: "products", element: <Products /> },
              { path: "products/add", element: <ProductForm /> },
              { path: "products/:id", element: <ProductDetail /> },
              { path: "products/:id/edit", element: <ProductForm /> },
              { path: "stock", element: <Inventory /> },
            ]
          },
          { path: "vendors", element: <Vendors /> },
          { path: "vendors/add", element: <VendorForm /> },
          { path: "vendors/:id", element: <VendorDetail /> },
          { path: "vendors/:id/edit", element: <VendorForm /> },
          { path: "purchases", element: <Purchases /> },
          { path: "purchases/add", element: <PurchaseForm /> },
          { path: "purchases/:id", element: <PurchaseDetail /> },
          { path: "purchases/:id/edit", element: <PurchaseForm /> },
          { path: "sales", element: <Sales /> },
          { path: "sales/add", element: <SaleForm /> },
          { path: "sales/:id", element: <SaleDetail /> },
          { path: "sales/:id/edit", element: <SaleForm /> },
          { path: "reports", element: <Reports /> },
          { path: "profile", element: <Profile /> },
        ],
      },
    ],
  },
  {
    path: "/",
    element: <ProtectedRoute allowedRoles={["ADMIN"]} />,
    children: [
      {
        path: "/",
        element: <MainLayout />,
        children: [
          { path: "users", element: <Users /> },
          { path: "users/:id/edit", element: <EditUser /> },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
