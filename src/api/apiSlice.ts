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

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL === '/' ? '' : import.meta.env.VITE_API_URL,
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
  baseUrl: import.meta.env.VITE_API_URL === '/' ? '' : import.meta.env.VITE_API_URL,
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
  tagTypes: ['User', 'Stock', 'Vendor', 'Category', 'Product', 'Purchase', 'Sale'],
  endpoints: () => ({}),
});
