'use client';
import { BottomNav } from '@/components/ui/BottomNav';
import { useCurrentUser } from '@/lib/use-current-user';

export const HeaderWrapper = () => {
  const { user } = useCurrentUser();
  return <BottomNav isAuthenticated={user?.authenticated ?? false} />;
};
