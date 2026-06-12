/**
 * Base API Slice for NextStock Management System
 * Handles data fetching, caching, and automatic token re-authentication.
 */
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';
import { logOut, setCredentials } from '../features/auth/authSlice';
import { Mutex } from 'async-mutex';

const mutex = new Mutex();

const getBaseUrl = () => {
  // Use relative URLs in development to leverage Vite's proxy (handles CORS automatically)
  if (import.meta.env.DEV) return '';

  const url = import.meta.env.VITE_API_URL;
  if (!url || url === '/') return '';

  // If it's already a full URL, use it as is
  if (url.startsWith('http')) return url.endsWith('/') ? url.slice(0, -1) : url;

  // Build absolute URL for production/built app
  const isLocal = url.includes('localhost') || url.includes('127.0.0.1');
  const protocol = isLocal ? 'http' : 'https';
  const port = isLocal && import.meta.env.VITE_API_PORT ? `:${import.meta.env.VITE_API_PORT}` : '';
  
  // Remove trailing slash if present
  const normalizedUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  
  return `${protocol}://${normalizedUrl}${port}`;
};

const baseQuery = fetchBaseQuery({
  baseUrl: getBaseUrl(),
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// Same-origin via Vite proxy — cookies are sent automatically
const baseQueryWithCredentials = fetchBaseQuery({
  baseUrl: getBaseUrl(),
  credentials: 'include',
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  await mutex.waitForUnlock();

  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        const refreshResult = await baseQueryWithCredentials(
          { url: '/api/auth/refresh', method: 'POST' },
          api,
          extraOptions,
        );

        if (refreshResult.data) {
          const user = (api.getState() as RootState).auth.user;
          const accessToken =
            (refreshResult.data as any).accessToken ||
            (refreshResult.data as any).token;

          if (user && accessToken) {
            api.dispatch(setCredentials({ user, accessToken }));
            result = await baseQuery(args, api, extraOptions);
          } else {
            api.dispatch(logOut());
          }
        } else {
          api.dispatch(logOut());
        }
      } finally {
        release();
      }
    } else {
      await mutex.waitForUnlock();
      result = await baseQuery(args, api, extraOptions);
    }
  }

  return result;
};

export const apiSlice = createApi({
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Stock', 'Vendor', 'Category', 'Product', 'Purchase', 'Sale', 'Audit', 'Requisition'],
  endpoints: () => ({}),
});
