'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Ticket,
  Users,
  LogOut,
  ClipboardList,
  Settings,
  Archive,
  ChevronLeft,
  ChevronRight,
  User,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EMPLOYEE_ROLES, SYSTEM_ROLES } from '@/lib/constants';

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const adminLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/tickets', label: 'PD Aktif', icon: Ticket },
    { href: '/archive', label: 'Arsip', icon: Archive },
    { href: '/users', label: 'Manajemen User', icon: Users },
    { href: '/settings/steps', label: 'Pengaturan Step', icon: Settings },
    { href: '/settings/advanced', label: 'Pengaturan Lanjutan', icon: Wrench },
  ];

  const supervisorLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/tickets', label: 'PD Aktif', icon: Ticket },
    { href: '/archive', label: 'Arsip', icon: Archive },
  ];

  const employeeLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/my-tasks', label: 'Tugas Saya', icon: ClipboardList },
  ];

  const links =
    user?.systemRole === 'admin'
      ? adminLinks
      : user?.systemRole === 'supervisor'
      ? supervisorLinks
      : employeeLinks;

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <aside 
      className={cn(
        "bg-slate-900 text-white h-screen flex flex-col sticky top-0 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className={cn(
        "p-4 border-b border-slate-700 flex items-center",
        collapsed ? "justify-center" : "justify-between"
      )}>
        <div className={cn(
          "overflow-hidden transition-all duration-300",
          collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
        )}>
          <h1 className="text-xl font-bold whitespace-nowrap">Monitoring PD</h1>
          <p className="text-sm text-slate-400 mt-1 whitespace-nowrap">Balmon I Semarang</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="bg-slate-700 text-white hover:bg-slate-600 p-2"
          onClick={onToggle}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </Button>
      </div>

      <nav className="flex-1 p-2 overflow-y-auto">
        <ul className="space-y-2">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  'flex items-center rounded-lg transition-colors',
                  pathname === link.href
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800',
                  collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-3'
                )}
                title={collapsed ? link.label : undefined}
              >
                <link.icon className="w-5 h-5 flex-shrink-0" />
                <span className={cn(
                  "whitespace-nowrap overflow-hidden transition-all duration-300",
                  collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                )}>
                  {link.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-2 border-t border-slate-700 mt-auto">
        {!collapsed && (
          <div className="mb-3 px-3 py-2 bg-slate-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate">
                  {user?.systemRole === 'employee' && user?.employeeRole
                    ? EMPLOYEE_ROLES[user.employeeRole]
                    : SYSTEM_ROLES[user?.systemRole || '']}
                </p>
              </div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mb-3 flex justify-center">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center" title={user?.name}>
              <User className="w-5 h-5" />
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          className={cn(
            "w-full text-slate-300 hover:text-white hover:bg-slate-800",
            collapsed ? "justify-center px-2" : "justify-start"
          )}
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="ml-3">Logout</span>}
        </Button>
      </div>
    </aside>
  );
}
