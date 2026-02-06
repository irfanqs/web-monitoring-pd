'use client';

import Link from 'next/link';
import Image from 'next/image';
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
        "bg-[#f1f7fd] text-[#0160a9] h-screen flex flex-col sticky top-0 transition-all duration-300 shadow-lg",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className={cn(
        "p-4 border-b border-[#0160a9]/10 flex items-center justify-between gap-3",
        collapsed && "justify-center"
      )}>
        {!collapsed && (
          <div className="flex-1">
            {/* Logo Balmon */}
            <Image 
              src="/logo-balmon.png" 
              alt="Balai Monitor Logo" 
              width={200} 
              height={80}
              className="object-contain"
              priority
            />
            <p className="text-xs text-[#0160a9]/70 mt-2 whitespace-wrap text-left">Monitoring Perjalanan Dinas Balmon I Semarang</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="bg-[#0160a9]/10 text-[#0160a9] hover:bg-[#0160a9]/20 p-2 flex-shrink-0"
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
                    ? 'bg-[#2880b9] !text-white font-medium shadow-md'
                    : 'text-[#2880b9] hover:bg-[#2880b9]/10',
                  collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-3'
                )}
                title={collapsed ? link.label : undefined}
              >
                <link.icon className={cn(
                  "w-5 h-5 flex-shrink-0",
                  pathname === link.href ? "text-white" : ""
                )} />
                <span className={cn(
                  "whitespace-nowrap overflow-hidden transition-all duration-300",
                  pathname === link.href ? "text-white" : "",
                  collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                )}>
                  {link.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-2 border-t border-[#0160a9]/10 mt-auto">
        {!collapsed && (
          <div className="mb-3 px-3 py-2 bg-[#0160a9]/10 rounded-lg border border-[#0160a9]/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0160a9]/20 flex items-center justify-center">
                <User className="w-5 h-5 text-[#0160a9]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-[#0160a9]">{user?.name}</p>
                <p className="text-xs text-[#0160a9]/70 truncate">
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
            <div className="w-10 h-10 rounded-full bg-[#0160a9]/20 flex items-center justify-center" title={user?.name}>
              <User className="w-5 h-5 text-[#0160a9]" />
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          className={cn(
            "w-full text-[#0160a9] hover:text-white hover:bg-[#0160a9]",
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
