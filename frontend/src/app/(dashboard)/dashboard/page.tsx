'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface StepConfig {
  stepNumber: number;
  isLsOnly: boolean;
  isNonLsOnly: boolean;
}

interface Stats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  recentTickets: Array<{
    id: string;
    ticketNumber: string;
    activityName: string;
    assignmentLetterNumber: string;
    currentStep: number;
    status: string;
    isLs: boolean;
    createdBy: { name: string };
  }>;
}

interface TicketItem {
  id: string;
  ticketNumber: string;
  activityName: string;
  assignmentLetterNumber: string;
  currentStep: number;
  status: 'pending' | 'in_progress' | 'completed';
}

type StatusFilter = 'all' | 'pending' | 'in_progress' | 'completed';

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
  const [stepConfigs, setStepConfigs] = useState<StepConfig[]>([]);
  const { user } = useAuthStore();

  useEffect(() => {
    api.get('/dashboard/stats').then((res) => setStats(res.data));
    api.get('/steps').then((res) => setStepConfigs(res.data));
    api.get('/tickets').then((res) => setTickets(res.data));
  }, []);

  const getTotalSteps = () => stepConfigs.length || 15;

  const getMaxStep = () => {
    return stepConfigs.length > 0 ? Math.max(...stepConfigs.map(s => s.stepNumber)) : 15;
  };

  const filteredTickets = useMemo(() => {
    if (activeFilter === 'all') {
      return tickets;
    }

    return tickets.filter((ticket) => ticket.status === activeFilter);
  }, [tickets, activeFilter]);

  const listTitle = useMemo(() => {
    if (activeFilter === 'pending') return 'Daftar PD - Pending';
    if (activeFilter === 'in_progress') return 'Daftar PD - In Progress';
    if (activeFilter === 'completed') return 'Daftar PD - Completed';
    return 'Daftar PD - Semua Status';
  }, [activeFilter]);

  if (!stats) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-slate-500">Selamat datang, {user?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card
          onClick={() => setActiveFilter('all')}
          className={`cursor-pointer transition ${activeFilter === 'all' ? 'ring-2 ring-slate-700 bg-slate-50' : 'hover:bg-slate-50'}`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total PD</CardTitle>
            <Briefcase className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveFilter('pending')}
          className={`cursor-pointer transition ${activeFilter === 'pending' ? 'ring-2 ring-yellow-500 bg-yellow-50' : 'hover:bg-slate-50'}`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveFilter('in_progress')}
          className={`cursor-pointer transition ${activeFilter === 'in_progress' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-slate-50'}`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveFilter('completed')}
          className={`cursor-pointer transition ${activeFilter === 'completed' ? 'ring-2 ring-green-500 bg-green-50' : 'hover:bg-slate-50'}`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{listTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTickets.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-500">
                Tidak ada PD dengan status ini.
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{ticket.assignmentLetterNumber}</p>
                    <p className="text-sm text-slate-500">{ticket.activityName}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-500">
                      Step {ticket.currentStep > getMaxStep() ? 'Selesai' : `${ticket.currentStep}/${getTotalSteps()}`}
                    </span>
                    <Badge
                      className={
                        ticket.status === 'completed'
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : ticket.status === 'in_progress'
                          ? 'bg-blue-500 hover:bg-blue-600 text-white'
                          : 'bg-yellow-300 hover:bg-amber-300 text-slate-900'
                      }
                    >
                      {ticket.status === 'completed'
                        ? 'Selesai'
                        : ticket.status === 'in_progress'
                        ? 'Proses'
                        : 'Pending'}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
