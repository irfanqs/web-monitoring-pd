'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export interface PicUser {
  id: string;
  name: string;
  employeeRole: string | null;
}

interface PicTicket {
  assignedPpdUser1?: { name: string } | null;
  assignedPpdUser2?: { name: string } | null;
}

// Names of the employees who hold each role, so every step can show its PIC before it is processed
export function usePicNames() {
  const [picUsers, setPicUsers] = useState<PicUser[]>([]);

  useEffect(() => {
    api.get('/users/pic').then((res) => setPicUsers(res.data)).catch(console.error);
  }, []);

  const getPicNames = (ticket: PicTicket | null | undefined, employeeRole?: string) => {
    if (!employeeRole) return '-';
    // For PPD role, if assigned to specific users, show only those assigned users
    if (employeeRole === 'PPD' && (ticket?.assignedPpdUser1 || ticket?.assignedPpdUser2)) {
      return [ticket.assignedPpdUser1?.name, ticket.assignedPpdUser2?.name].filter(Boolean).join(' / ');
    }
    const names = picUsers.filter((u) => u.employeeRole === employeeRole).map((u) => u.name);
    return names.length > 0 ? names.join(' / ') : '-';
  };

  return { picUsers, getPicNames };
}
