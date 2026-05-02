'use client';

import useSWR from 'swr';
import { customInstance } from '@/lib/axios';

interface CurrentUser {
  name: string | null;
}

async function fetchCurrentUser(): Promise<CurrentUser> {
  const data = await customInstance<{ authenticated: boolean; user?: { name: string } }>({
    url: '/api/v1/auth/session',
    method: 'GET',
  });
  return { name: data.user?.name ?? null };
}

export function useCurrentUser(): CurrentUser {
  const { data } = useSWR<CurrentUser>('current-user', fetchCurrentUser, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
  return { name: data?.name ?? null };
}
