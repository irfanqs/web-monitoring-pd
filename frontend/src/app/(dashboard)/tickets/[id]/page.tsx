'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { EMPLOYEE_ROLES } from '@/lib/constants';
import { ArrowLeft, Download, SkipForward } from 'lucide-react';

interface StepConfig {
  id: number;
  stepNumber: number;
  stepName: string;
  requiredEmployeeRole: string;
  description: string | null;
  isLsOnly: boolean;
  isNonLsOnly: boolean;
  isParallel: boolean;
  parallelGroup: string | null;
}

interface Ticket {
  id: string;
  ticketNumber: string;
  activityName: string;
  assignmentLetterNumber: string;
  uraian?: string;
  startDate: string;
  isLs: boolean;
  currentStep: number;
  status: string;
  createdAt: string;
  createdBy: { name: string };
  assignedPpdUser?: { id: string; name: string } | null;
  histories: Array<{
    id: string;
    stepNumber: number;
    processorName: string;
    processedAt: string;
    fileUrl: string;
    fileName: string;
    notes: string;
  }>;
}

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [stepConfigs, setStepConfigs] = useState<StepConfig[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string; employeeRole: string | null }>>([]);
  const [skipping, setSkipping] = useState(false);
  const { user } = useAuthStore();

  const fetchTicket = () => {
    api.get(`/tickets/${params.id}`).then((res) => setTicket(res.data));
  };

  const fetchStepConfigs = () => {
    api.get('/steps').then((res) => setStepConfigs(res.data));
  };

  const fetchUsers = () => {
    api.get('/users').then((res) => setUsers(res.data));
  };

  useEffect(() => {
    fetchTicket();
    fetchStepConfigs();
    fetchUsers();
  }, [params.id]);

  // Helper functions
  const getStepConfig = (stepNumber: number) => stepConfigs.find(s => s.stepNumber === stepNumber);
  
  const getPicNames = (employeeRole: string, stepNumber?: number) => {
    // For step 12 (PPD), if assigned to specific user, show only that user
    if (stepNumber === 12 && ticket?.assignedPpdUser) {
      return ticket.assignedPpdUser.name;
    }
    
    const usersWithRole = users.filter(u => u.employeeRole === employeeRole);
    return usersWithRole.length > 0 ? usersWithRole.map(u => u.name).join(' / ') : '-';
  };

  const getMaxStep = () => {
    return stepConfigs.length > 0 ? Math.max(...stepConfigs.map(s => s.stepNumber)) : 15;
  };

  const getTotalSteps = () => stepConfigs.length || 15;

  const getParallelSteps = (parallelGroup: string | null) => {
    if (!parallelGroup) return [];
    return stepConfigs.filter(s => s.isParallel && s.parallelGroup === parallelGroup);
  };

  const handleDownload = async (historyId: string, fileName: string) => {
    try {
      const response = await api.get(
        `/tickets/${params.id}/files/${historyId}/download`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download failed', error);
    }
  };

  const handleAdminSkip = async (stepNumber?: number) => {
    setSkipping(true);
    try {
      await api.post(`/tickets/${params.id}/admin-skip`, { stepNumber });
      fetchTicket();
    } catch (error) {
      console.error('Skip failed', error);
    } finally {
      setSkipping(false);
    }
  };

  if (!ticket) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button size="sm" className="bg-slate-800 text-white hover:bg-slate-700 mr-2" onClick={() => router.push('/tickets')}>
            <ArrowLeft className="w-4 h-4 " />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{ticket.activityName}</h1>
            <p className="text-slate-500">{ticket.assignmentLetterNumber}</p>
          </div>
        </div>
        <Badge
          className={
            ticket.status === 'completed'
              ? 'bg-green-500 hover:bg-green-600 text-white text-lg px-4 py-1'
              : ticket.status === 'in_progress'
              ? 'bg-blue-500 hover:bg-blue-600 text-white text-lg px-4 py-1'
              : 'bg-yellow-300 hover:bg-yellow-400 text-slate-900 text-lg px-4 py-1'
          }
        >
          {ticket.status === 'completed'
            ? 'Selesai'
            : ticket.status === 'in_progress'
            ? 'Proses'
            : 'Pending'}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressIndicator
            currentStep={ticket.currentStep}
            histories={ticket.histories}
            isLs={ticket.isLs}
            stepConfigs={stepConfigs}
          />
        </CardContent>
      </Card>

      {ticket.currentStep <= getMaxStep() && (
        <Card>
          <CardHeader>
            <CardTitle>Jobdesk Step Saat Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Check if current step is parallel */}
              {(() => {
                const currentConfig = getStepConfig(ticket.currentStep);
                const parallelSteps = currentConfig?.parallelGroup 
                  ? getParallelSteps(currentConfig.parallelGroup) 
                  : [];
                
                if (parallelSteps.length > 1) {
                  // Parallel steps view
                  return (
                    <div>
                      <p className="text-sm text-slate-500 mb-2">
                        Step {parallelSteps.map(s => s.stepNumber).join(', ')} (Paralel) - {ticket.isLs ? 'LS' : 'Non-LS'}
                      </p>
                      <div className="space-y-2">
                        {parallelSteps.map((step) => {
                          const isCompleted = ticket.histories.some(h => h.stepNumber === step.stepNumber);
                          const picNames = getPicNames(step.requiredEmployeeRole, step.stepNumber);
                          return (
                            <div key={step.stepNumber} className={`p-3 rounded-lg border ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{EMPLOYEE_ROLES[step.requiredEmployeeRole] || step.stepName}</p>
                                  <p className="text-sm text-slate-500">PIC: {picNames}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className={isCompleted ? 'bg-green-500' : 'bg-yellow-300 text-slate-900'}>
                                    {isCompleted ? 'Selesai' : 'Pending'}
                                  </Badge>
                                  {user?.systemRole === 'admin' && !isCompleted && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleAdminSkip(step.stepNumber)}
                                      disabled={skipping}
                                      className="text-orange-600 border-orange-300 hover:bg-orange-50"
                                    >
                                      <SkipForward className="w-4 h-4 mr-1" />
                                      Skip
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-slate-600 mt-1">{step.description}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                } else {
                  // Sequential step view
                  const picNames = currentConfig ? getPicNames(currentConfig.requiredEmployeeRole, ticket.currentStep) : '-';
                  return (
                    <div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-500">Step {ticket.currentStep} dari {getTotalSteps()}</p>
                          <p className="font-medium text-lg">
                            {currentConfig ? (EMPLOYEE_ROLES[currentConfig.requiredEmployeeRole] || currentConfig.stepName) : ''}
                          </p>
                          <p className="text-sm text-slate-500">PIC: {picNames}</p>
                        </div>
                        {user?.systemRole === 'admin' && (
                          <Button
                            variant="outline"
                            onClick={() => handleAdminSkip()}
                            disabled={skipping}
                            className="text-orange-600 border-orange-300 hover:bg-orange-50"
                          >
                            <SkipForward className="w-4 h-4 mr-2" />
                            {skipping ? 'Skipping...' : 'Skip Step (Debug)'}
                          </Button>
                        )}
                      </div>
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-2">
                        <p className="text-slate-700 leading-relaxed">
                          {currentConfig?.description || 'Tidak ada deskripsi'}
                        </p>
                      </div>
                    </div>
                  );
                }
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Perjalanan Dinas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Nomor Surat Tugas</p>
              <p className="font-medium">{ticket.assignmentLetterNumber}</p>
            </div>
            {ticket.uraian && (
              <div>
                <p className="text-sm text-slate-500">Uraian</p>
                <p className="font-medium">{ticket.uraian}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-slate-500">Tipe</p>
              <Badge variant={ticket.isLs ? 'default' : 'secondary'}>
                {ticket.isLs ? 'LS (Langsung - Bendahara)' : 'Non-LS'}
              </Badge>
              <p className="text-xs text-slate-400 mt-1">
                Total {getTotalSteps()} step
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Tanggal Penerimaan Berkas</p>
              <p className="font-medium">
                {new Date(ticket.startDate).toLocaleDateString('id-ID', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Dibuat Oleh</p>
              <p className="font-medium">{ticket.createdBy.name}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Tanggal Dibuat</p>
              <p className="font-medium">
                {new Date(ticket.createdAt).toLocaleString('id-ID')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Riwayat Proses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ticket.histories.length === 0 ? (
                <p className="text-slate-500">Belum ada riwayat</p>
              ) : (
                ticket.histories.map((history) => {
                  const stepConfig = getStepConfig(history.stepNumber);
                  return (
                    <div
                      key={history.id}
                      className="p-4 bg-slate-50 rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <Badge>Step {history.stepNumber}</Badge>
                        <span className="text-sm text-slate-500">
                          {new Date(history.processedAt).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <p className="font-medium">
                        {stepConfig ? (EMPLOYEE_ROLES[stepConfig.requiredEmployeeRole] || stepConfig.stepName) : `Step ${history.stepNumber}`}
                      </p>
                      <p className="text-sm text-slate-600">
                        Diproses oleh: {history.processorName}
                      </p>
                      {history.notes && (
                        <div className="text-sm text-slate-500">
                          <span className="font-medium">Catatan:</span>
                          <p className="whitespace-pre-wrap mt-1">{history.notes}</p>
                        </div>
                      )}
                      {history.fileName && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDownload(history.id, history.fileName)
                          }
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {history.fileName}
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
