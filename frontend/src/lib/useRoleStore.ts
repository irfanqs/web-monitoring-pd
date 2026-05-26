import { create } from 'zustand';
import api from './api';
import { EMPLOYEE_ROLES } from './constants';

interface RoleState {
  roleLabels: Record<string, string>;
  fetchRoleLabels: () => Promise<void>;
  getRoleLabel: (key: string) => string;
}

export const useRoleStore = create<RoleState>((set, get) => ({
  roleLabels: {},
  fetchRoleLabels: async () => {
    try {
      const res = await api.get('/settings');
      if (res.data?.roleLabels) {
        set({ roleLabels: JSON.parse(res.data.roleLabels) });
      }
    } catch (error) {
      console.error('Failed to fetch role labels', error);
    }
  },
  getRoleLabel: (key: string) => {
    const { roleLabels } = get();
    return roleLabels[key] || EMPLOYEE_ROLES[key] || key;
  }
}));
