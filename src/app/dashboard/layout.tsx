'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import GlobalAiPoller from '@/components/GlobalAiPoller';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (_hasHydrated) {
      setIsReady(true);
      if (!user) {
        router.push('/login');
      }
    }
  }, [user, _hasHydrated, router]);

  if (!isReady) {
    return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <GlobalAiPoller />
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
