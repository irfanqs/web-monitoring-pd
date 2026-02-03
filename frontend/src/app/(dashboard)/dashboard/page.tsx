'use client';

import { useEffect, useState } from 'react';
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
    currentStep: number;
    status: string;
    isLs: boolean;
    createdBy: { name: string };
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [stepConfigs, setStepConfigs] = useState<StepConfig[]>([]);
  const { user } = useAuthStore();

  useEffect(() => {
    api.get('/dashboard/stats').then((res) => setStats(res.data));
    api.get('/steps').then((res) => setStepConfigs(res.data));
  }, []);

  const getTotalSteps = () => stepConfigs.length || 15;

  const getMaxStep = () => {
    return stepConfigs.length > 0 ? Math.max(...stepConfigs.map(s => s.stepNumber)) : 15;
  };

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total PD</CardTitle>
            <Briefcase className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
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
          <CardTitle>Perjalanan Dinas Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{ticket.ticketNumber}</p>
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
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
