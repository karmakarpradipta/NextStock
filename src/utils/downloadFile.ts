import { store } from "../store";

const getBaseUrl = () => {
  // Use /api in development to leverage Vite's proxy
  if (import.meta.env.DEV) return '/api';

  const url = import.meta.env.VITE_API_URL;
  if (!url || url === '/') return '/api';

  // If it's already a full URL, use it as is
  if (url.startsWith('http')) return url.endsWith('/') ? url.slice(0, -1) : url;

  // Build absolute URL for production/built app
  const isLocal = url.includes('localhost') || url.includes('127.0.0.1');
  const protocol = isLocal ? 'http' : 'https';
  const port = isLocal && import.meta.env.VITE_API_PORT ? `:${import.meta.env.VITE_API_PORT}` : '';

  const normalizedUrl = url.endsWith('/') ? url.slice(0, -1) : url;

  return `${protocol}://${normalizedUrl}${port}/api`;
};

const BASE_URL = getBaseUrl();

export const downloadReport = async (
  endpoint: string,
  filename: string,
  format: "pdf" | "csv" = "pdf"
) => {
  try {
    const token = store.getState().auth.token;
    const separator = endpoint.includes("?") ? "&" : "?";
    const url = `${BASE_URL}${endpoint}${separator}export=${format}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error(`Export failed with status ${response.status}`);

    const blob = await response.blob();
    const mimeType = format === "pdf" ? "application/pdf" : "text/csv";
    const typedBlob = new Blob([blob], { type: mimeType });

    const downloadUrl = URL.createObjectURL(typedBlob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `${filename}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  } catch (err) {
    console.error("Download failed:", err);
  }
};

export const downloadFilteredReport = async (
  fullEndpointWithParams: string,
  filename: string,
  format: "pdf" | "csv"
) => {
  try {
    const token = store.getState().auth.token;
    const separator = fullEndpointWithParams.includes("?") ? "&" : "?";
    const url = `${BASE_URL}${fullEndpointWithParams}${separator}export=${format}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error(`Export failed with status ${response.status}`);

    const blob = await response.blob();
    const mimeType = format === "pdf" ? "application/pdf" : "text/csv";
    const typedBlob = new Blob([blob], { type: mimeType });

    const objectUrl = URL.createObjectURL(typedBlob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = `${filename}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  } catch (err) {
    console.error("Download failed:", err);
  }
};

export const openInvoice = (invoiceUrl: string) => {
  if (!invoiceUrl) return;
  window.open(invoiceUrl, "_blank");
};

export const downloadInvoice = (invoiceUrl: string, orderNumber: string) => {
  if (!invoiceUrl) return;
  const link = document.createElement("a");
  link.href = invoiceUrl;
  link.download = `invoice-${orderNumber}.pdf`;
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};