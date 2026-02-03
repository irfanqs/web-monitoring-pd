'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useAuthStore } from '@/lib/store';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuthStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (!user) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      <main className="flex-1 bg-slate-50 p-8 overflow-x-auto">{children}</main>
    </div>
  );
}
