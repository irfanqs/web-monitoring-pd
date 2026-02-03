'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { EMPLOYEE_ROLES, STEP_ROLES } from '@/lib/constants';
import { Upload, Download, FileText, Eye, RotateCcw } from 'lucide-react';

interface Ticket {
  id: string;
  ticketNumber: string;
  activityName: string;
  assignmentLetterNumber: string;
  isLs: boolean;
  currentStep: number;
  status: string;
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

interface StepConfig {
  stepNumber: number;
  stepName: string;
  requiredEmployeeRole: string;
  isLsOnly: boolean;
  isNonLsOnly: boolean;
  isParallel: boolean;
  parallelGroup: string | null;
}

export default function MyTasksPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [historyTickets, setHistoryTickets] = useState<Ticket[]>([]);
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [selisihType, setSelisihType] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [stepConfigs, setStepConfigs] = useState<StepConfig[]>([]);
  
  // Return to previous step states
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [returnTicket, setReturnTicket] = useState<Ticket | null>(null);
  const [returnNotes, setReturnNotes] = useState('');
  const [returning, setReturning] = useState(false);
  
  const { user } = useAuthStore();

  const fetchTasks = () => {
    api.get('/tickets/my-tasks').then((res) => setTickets(res.data));
  };

  const fetchHistory = () => {
    api.get('/tickets/my-history').then((res) => setHistoryTickets(res.data));
  };

  const fetchStepConfigs = () => {
    api.get('/steps').then((res) => setStepConfigs(res.data));
  };

  useEffect(() => {
    fetchTasks();
    fetchHistory();
    fetchStepConfigs();
  }, []);

  // Get the step number this user should process for a ticket
  const getUserStepForTicket = (ticket: Ticket): number | null => {
    if (!user?.employeeRole) return null;
    
    // For LS tickets with parallel steps (1-3)
    if (ticket.isLs && ticket.currentStep <= 3) {
      const userSteps = Object.entries(STEP_ROLES)
        .filter(([_, role]) => role === user.employeeRole)
        .map(([step]) => parseInt(step))
        .filter(step => [1, 2, 3].includes(step));
      
      // Find a step that hasn't been completed yet
      const completedSteps = ticket.histories.map(h => h.stepNumber);
      return userSteps.find(s => !completedSteps.includes(s)) || null;
    }
    
    // Normal sequential flow
    return ticket.currentStep;
  };

  const handleProcess = async () => {
    if (!selectedTicket) return;
    
    // Validate selisih for step 6 (only for LS tickets)
    if (selectedStep === 6 && selectedTicket.isLs && !selisihType) {
      alert('Pilih status selisih anggaran');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    if (file) formData.append('file', file);
    
    // Combine selisih type with notes for step 6 (only for LS tickets)
    let finalNotes = notes;
    if (selectedStep === 6 && selectedTicket.isLs && selisihType) {
      finalNotes = `[${selisihType}]` + (notes ? ` ${notes}` : '');
    }
    formData.append('notes', finalNotes);
    
    // For LS parallel steps, include the step number
    if (selectedStep) {
      formData.append('stepNumber', selectedStep.toString());
    }

    try {
      await api.post(`/tickets/${selectedTicket.id}/process`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSelectedTicket(null);
      setSelectedStep(null);
      setFile(null);
      setNotes('');
      setSelisihType('');
      fetchTasks();
      fetchHistory(); // Refresh history after processing
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProcess = (ticket: Ticket) => {
    const step = getUserStepForTicket(ticket);
    setSelectedTicket(ticket);
    setSelectedStep(step);
    setSelisihType('');
    setNotes('');
  };

  const handleDownload = async (
    ticketId: string,
    historyId: string,
    fileName: string
  ) => {
    try {
      const response = await api.get(
        `/tickets/${ticketId}/files/${historyId}/download`,
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

  const handleOpenReturnDialog = (ticket: Ticket) => {
    setReturnTicket(ticket);
    setReturnNotes('');
    setShowReturnDialog(true);
  };

  const handleReturnToPrevious = async () => {
    if (!returnTicket || !returnNotes.trim()) {
      alert('Catatan alasan pengembalian wajib diisi');
      return;
    }

    setReturning(true);
    try {
      await api.post(`/tickets/${returnTicket.id}/return-to-previous`, {
        returnNotes: returnNotes.trim(),
      });
      setShowReturnDialog(false);
      setReturnTicket(null);
      setReturnNotes('');
      fetchTasks();
      fetchHistory();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal mengembalikan ke step sebelumnya');
      console.error(error);
    } finally {
      setReturning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tugas Saya</h1>
        <p className="text-slate-500">
          Role: {user?.employeeRole && EMPLOYEE_ROLES[user.employeeRole]}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('current')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'current'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Tugas Aktif ({tickets.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'history'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Riwayat ({historyTickets.length})
        </button>
      </div>

      {/* Current Tasks Tab */}
      {activeTab === 'current' && (
        <>
          {tickets.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-500">
                Tidak ada tugas yang perlu diproses saat ini
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {tickets.map((ticket) => {
                const userStep = getUserStepForTicket(ticket);
                const isParallelStep = ticket.isLs && ticket.currentStep <= 3;
                
                return (
                  <Card key={ticket.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{ticket.ticketNumber}</CardTitle>
                    <p className="text-slate-500">{ticket.activityName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={ticket.isLs ? 'default' : 'secondary'}>
                      {ticket.isLs ? 'LS' : 'Non-LS'}
                    </Badge>
                    <Badge>
                      {isParallelStep ? `Step ${userStep} (Paralel)` : `Step ${ticket.currentStep}`}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500">No. Surat Tugas</p>
                  <p className="font-medium">{ticket.assignmentLetterNumber}</p>
                </div>

                <ProgressIndicator
                  currentStep={ticket.currentStep}
                  histories={ticket.histories}
                  compact
                  isLs={ticket.isLs}
                  stepConfigs={stepConfigs}
                />

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-500 mb-2">Jobdesk Anda (Step {userStep}):</p>
                  <p className="text-slate-700 leading-relaxed">
                    {userStep === 1 && 'Membuat rekapitulasi biaya perjalanan dinas berdasarkan Surat Tugas dan Nota Dinas Anggaran'}
                    {userStep === 2 && 'Membuat daftar nominatif biaya perjalanan dinas'}
                    {userStep === 3 && 'Memasukkan nilai permohonan anggaran biaya ke aplikasi SAKTI'}
                    {userStep === 4 && 'Mengecek ketersediaan anggaran'}
                    {userStep === 5 && 'Memasukkan nilai permohonan anggaran biaya ke aplikasi SAKTI'}
                    {userStep === 6 && 'Memeriksa kelengkapan berkas perjalanan dinas dari pelaksana perjalanan dinas'}
                    {userStep === 7 && 'Membuat rincian biaya perjalanan dinas'}
                    {userStep === 8 && 'Memeriksa rincian biaya perjalanan dinas'}
                    {userStep === 9 && 'Memeriksa rincian biaya perjalanan dinas dibandingkan dengan permohonan anggaran biaya awal apakah ada selisih lebih untuk pengembalian atau tidak'}
                    {userStep === 10 && 'Menandatangani kuitansi dll berkas perjalanan dinas'}
                    {userStep === 11 && 'Menandatangani kuitansi dll berkas perjalanan dinas'}
                    {userStep === 12 && 'Menandatangani kuitansi dll berkas perjalanan dinas'}
                    {userStep === 13 && 'Melakukan pengembalian selisih kelebihan anggaran ke MPN G3 Modul Penerimaan Negara versi G3'}
                    {userStep === 14 && 'Menandatangani kuitansi dll berkas perjalanan dinas'}
                    {userStep === 15 && 'Mengarsipkan kuitansi dll berkas perjalanan dinas'}
                  </p>
                </div>

                {ticket.histories.filter(h => h.fileUrl).length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">
                      File dari Step Sebelumnya:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ticket.histories.filter(h => h.fileUrl).map((h) => (
                        <Button
                          key={h.id}
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDownload(ticket.id, h.id, h.fileName)
                          }
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Step {h.stepNumber}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleOpenProcess(ticket)}
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Proses PD
                  </Button>
                  
                  {ticket.currentStep > 1 && (
                    <Button 
                      onClick={() => handleOpenReturnDialog(ticket)}
                      variant="destructive"
                      className="flex-1"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Kembalikan
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <>
          {historyTickets.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-500">
                Belum ada riwayat perjalanan dinas yang dikerjakan
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {historyTickets.map((ticket) => {
                const myHistory = ticket.histories.find(h => h.processorName === user?.name);
                
                return (
                  <Card key={ticket.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{ticket.ticketNumber}</CardTitle>
                          <p className="text-slate-500">{ticket.activityName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={ticket.isLs ? 'default' : 'secondary'}>
                            {ticket.isLs ? 'LS' : 'Non-LS'}
                          </Badge>
                          <Badge className={
                            ticket.status === 'completed' 
                              ? 'bg-green-500' 
                              : 'bg-blue-500'
                          }>
                            {ticket.status === 'completed' ? 'Selesai' : 'Dalam Proses'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm text-slate-500">No. Surat Tugas</p>
                        <p className="font-medium">{ticket.assignmentLetterNumber}</p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-500 mb-2">Step yang Saya Kerjakan:</p>
                        <div className="flex flex-wrap gap-2">
                          {ticket.histories
                            .filter(h => h.processorName === user?.name)
                            .map((h) => (
                              <Badge key={h.id} variant="outline" className="bg-slate-50">
                                Step {h.stepNumber} - {EMPLOYEE_ROLES[STEP_ROLES[h.stepNumber]]}
                              </Badge>
                            ))}
                        </div>
                      </div>

                      {myHistory && (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <p className="text-xs text-slate-500">Diproses pada:</p>
                          <p className="text-sm font-medium">
                            {new Date(myHistory.processedAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      )}

                      <ProgressIndicator
                        currentStep={ticket.currentStep}
                        histories={ticket.histories}
                        compact
                        isLs={ticket.isLs}
                        stepConfigs={stepConfigs}
                      />

                      <Link href={`/tickets/${ticket.id}`}>
                        <Button variant="outline" className="w-full">
                          <Eye className="w-4 h-4 mr-2" />
                          Lihat Detail
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      <Dialog
        open={!!selectedTicket}
        onOpenChange={() => {
          setSelectedTicket(null);
          setSelectedStep(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Proses {selectedTicket?.ticketNumber} - Step{' '}
              {selectedStep}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-slate-600 leading-relaxed">
                {selectedStep === 1 && 'Membuat rekapitulasi biaya perjalanan dinas berdasarkan Surat Tugas dan Nota Dinas Anggaran'}
                {selectedStep === 2 && 'Membuat daftar nominatif biaya perjalanan dinas'}
                {selectedStep === 3 && 'Memasukkan nilai permohonan anggaran biaya ke aplikasi SAKTI'}
                {selectedStep === 4 && 'Mengecek ketersediaan anggaran'}
                {selectedStep === 5 && 'Memasukkan nilai permohonan anggaran biaya ke aplikasi SAKTI'}
                {selectedStep === 6 && 'Memeriksa kelengkapan berkas perjalanan dinas dari pelaksana perjalanan dinas'}
                {selectedStep === 7 && 'Membuat rincian biaya perjalanan dinas'}
                {selectedStep === 8 && 'Memeriksa rincian biaya perjalanan dinas'}
                {selectedStep === 9 && 'Memeriksa rincian biaya perjalanan dinas dibandingkan dengan permohonan anggaran biaya awal apakah ada selisih lebih untuk pengembalian atau tidak'}
                {selectedStep === 10 && 'Menandatangani kuitansi dll berkas perjalanan dinas'}
                {selectedStep === 11 && 'Menandatangani kuitansi dll berkas perjalanan dinas'}
                {selectedStep === 12 && 'Menandatangani kuitansi dll berkas perjalanan dinas'}
                {selectedStep === 13 && 'Melakukan pengembalian selisih kelebihan anggaran ke MPN G3 Modul Penerimaan Negara versi G3'}
                {selectedStep === 14 && 'Menandatangani kuitansi dll berkas perjalanan dinas'}
                {selectedStep === 15 && 'Mengarsipkan kuitansi dll berkas perjalanan dinas'}
              </p>
            </div>

            {selectedTicket?.isLs && selectedStep && [1, 2, 3].includes(selectedStep) && (
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-700">
                  LS: Step 1-3 dapat diproses secara paralel.
                </p>
              </div>
            )}

            {/* Catatan dari Step Sebelumnya */}
            {selectedTicket && selectedStep && selectedStep > 1 && (() => {
              // Cari notes dari step sebelumnya (step terakhir yang diproses)
              const previousHistory = selectedTicket.histories
                .filter(h => h.stepNumber < selectedStep)
                .sort((a, b) => b.stepNumber - a.stepNumber)[0];

              if (previousHistory?.notes) {
                return (
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-start gap-2">
                      <FileText className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-purple-900 mb-1">
                          Catatan dari Step {previousHistory.stepNumber}
                        </p>
                        <p className="text-sm text-purple-700 leading-relaxed whitespace-pre-wrap">
                          {previousHistory.notes}
                        </p>
                        <p className="text-xs text-purple-600 mt-2">
                          Oleh: {previousHistory.processorName} • {new Date(previousHistory.processedAt).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {selectedStep === 6 && selectedTicket?.isLs && (
              <div className="space-y-2">
                <Label>Selisih Anggaran <span className="text-red-500">*</span></Label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="selisih"
                      value="Selisih Nihil"
                      checked={selisihType === 'Selisih Nihil'}
                      onChange={(e) => setSelisihType(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Selisih Nihil</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="selisih"
                      value="Selisih Kurang"
                      checked={selisihType === 'Selisih Kurang'}
                      onChange={(e) => setSelisihType(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Selisih Kurang</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="selisih"
                      value="Selisih Lebih"
                      checked={selisihType === 'Selisih Lebih'}
                      onChange={(e) => setSelisihType(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Selisih Lebih</span>
                  </label>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Upload File (Opsional)</Label>
              <Input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                className="file:pt-1 file:pr-2 file:font-normal file:text-gray-600"
              />
              <p className="text-xs text-slate-500">
                Format: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (Max 10MB)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Catatan (Opsional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tambahkan catatan jika diperlukan..."
              />
            </div>

            <Button
              onClick={handleProcess}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Memproses...' : 'Submit'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Kembalikan ke Step Sebelumnya */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              Kembalikan ke Step Sebelumnya
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-sm text-red-800 font-medium mb-2">
                Perhatian!
              </p>
              <p className="text-sm text-red-700 leading-relaxed">
                Anda akan mengembalikan PD ke step sebelumnya. 
                Riwayat step terakhir akan dihapus dan PD akan kembali ke step sebelumnya untuk diproses ulang.
              </p>
            </div>

            {returnTicket && (
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-sm text-slate-600">
                  <strong>Nomor PD:</strong> {returnTicket.ticketNumber}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  <strong>Aktivitas:</strong> {returnTicket.activityName}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  <strong>Step Saat Ini:</strong> {returnTicket.currentStep}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-red-700">
                Alasan Pengembalian <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="Jelaskan alasan pengembalian (wajib diisi)..."
                rows={4}
                className="border-red-300 focus:border-red-500 focus:ring-red-500"
              />
              <p className="text-xs text-red-600">
                Catatan ini akan dicatat dalam riwayat dan dilihat oleh petugas step sebelumnya.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowReturnDialog(false)}
                className="flex-1"
                disabled={returning}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={handleReturnToPrevious}
                className="flex-1"
                disabled={returning || !returnNotes.trim()}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {returning ? 'Mengembalikan...' : 'Kembalikan'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
