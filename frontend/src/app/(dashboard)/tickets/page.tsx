'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Eye, Trash2, Search, ChevronLeft, ChevronRight, FileSpreadsheet, FileText } from 'lucide-react';
import { EMPLOYEE_ROLES } from '@/lib/constants';
import { exportToExcel, exportToPDF } from '@/lib/exportUtils';

interface StepConfig {
  stepNumber: number;
  stepName: string;
  requiredEmployeeRole: string;
  isLsOnly: boolean;
  isNonLsOnly: boolean;
}

interface Ticket {
  id: string;
  ticketNumber: string;
  activityName: string;
  assignmentLetterNumber: string;
  uraian?: string;
  isLs: boolean;
  currentStep: number;
  status: string;
  startDate: string;
  createdAt: string;
  createdBy: { name: string };
  assignedPpdUser1?: { id: string; name: string } | null;
  assignedPpdUser2?: { id: string; name: string } | null;
  histories: Array<{
    id: string;
    stepNumber: number;
    processorName: string;
    processedAt: string;
    notes?: string;
    fileUrl?: string;
    fileName?: string;
  }>;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stepConfigs, setStepConfigs] = useState<StepConfig[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string; employeeRole: string | null }>>([]);
  const [template, setTemplate] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  // Filter & Sort states
  const [searchName, setSearchName] = useState('');
  const [searchSuratTugas, setSearchSuratTugas] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'ls' | 'status' | 'month'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [form, setForm] = useState({
    activityName: '',
    uraian: '',
    startDate: new Date().toISOString().split('T')[0],
    isLs: '' as '' | 'true' | 'false',
    assignedPpdUserId1: '',
    assignedPpdUserId2: '',
  });
  const [templateInputs, setTemplateInputs] = useState<Record<string, string>>({});

  const fetchTickets = () => {
    api.get('/tickets').then((res) => {
      const activeTickets = res.data.filter((t: Ticket) => t.status !== 'completed');
      setTickets(activeTickets);
    });
  };

  const fetchStepConfigs = () => {
    api.get('/steps').then((res) => setStepConfigs(res.data));
  };

  const fetchUsers = () => {
    api.get('/users').then((res) => setUsers(res.data));
  };

  const fetchSettings = () => {
    api.get('/settings').then((res) => {
      setTemplate(res.data.letterNumberTemplate || '');
    });
  };

  // Get placeholder count from template
  const getPlaceholders = () => {
    if (!template) return [];
    const matches = template.match(/\{(\d+)\}/g) || [];
    return [...new Set(matches)].sort();
  };

  // Build final letter number from template and inputs
  const buildLetterNumber = () => {
    if (!template) return Object.values(templateInputs).join('');
    let result = template;
    Object.entries(templateInputs).forEach(([key, value]) => {
      result = result.replace(key, value);
    });
    return result;
  };

  // Helper functions
  const getMaxStep = () => {
    return stepConfigs.length > 0 ? Math.max(...stepConfigs.map(s => s.stepNumber)) : 15;
  };

  const getTotalSteps = () => stepConfigs.length || 15;

  // Get current step info (who needs to process next)
  const getCurrentStepInfo = (ticket: Ticket) => {
    const stepConfig = stepConfigs.find(s => s.stepNumber === ticket.currentStep);
    if (!stepConfig) {
      return { role: '-', userName: '-' };
    }
    const roleName = stepConfig.requiredEmployeeRole 
      ? EMPLOYEE_ROLES[stepConfig.requiredEmployeeRole] || stepConfig.requiredEmployeeRole
      : '-';
    
    // For step 12 (PPD), show only the first assigned PPD user
    if (ticket.currentStep === 12 && ticket.assignedPpdUser1) {
      return {
        role: roleName,
        userName: ticket.assignedPpdUser1.name,
      };
    }
    
    // Find all users with this role
    const usersWithRole = users.filter(u => u.employeeRole === stepConfig.requiredEmployeeRole);
    const userNames = usersWithRole.length > 0 
      ? usersWithRole.map(u => u.name).join(' / ')
      : '-';
    
    return {
      role: roleName,
      userName: userNames,
    };
  };

  // Filtered and sorted tickets
  const filteredTickets = useMemo(() => {
    let result = [...tickets];
    
    // Filter by name
    if (searchName) {
      result = result.filter(t => 
        t.activityName.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    // Filter by surat tugas
    if (searchSuratTugas) {
      result = result.filter(t => 
        t.assignmentLetterNumber.toLowerCase().includes(searchSuratTugas.toLowerCase())
      );
    }
    
    // Filter by date
    if (filterDate) {
      result = result.filter(t => 
        t.startDate && t.startDate.startsWith(filterDate)
      );
    }
    
    // Filter by month (YYYY-MM format)
    if (filterMonth) {
      result = result.filter(t => 
        t.startDate && t.startDate.startsWith(filterMonth)
      );
    }
    
    // Sort
    result.sort((a, b) => {
      if (sortBy === 'name') {
        const cmp = a.activityName.localeCompare(b.activityName);
        return sortOrder === 'asc' ? cmp : -cmp;
      } else if (sortBy === 'ls') {
        const cmp = (a.isLs ? 1 : 0) - (b.isLs ? 1 : 0);
        return sortOrder === 'asc' ? cmp : -cmp;
      } else if (sortBy === 'status') {
        const statusOrder = { pending: 0, in_progress: 1, completed: 2 };
        const cmp = statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
        return sortOrder === 'asc' ? cmp : -cmp;
      } else if (sortBy === 'month') {
        // Sort by month (year-month)
        const monthA = a.startDate ? a.startDate.substring(0, 7) : '';
        const monthB = b.startDate ? b.startDate.substring(0, 7) : '';
        const cmp = monthA.localeCompare(monthB);
        return sortOrder === 'asc' ? cmp : -cmp;
      } else {
        const dateA = new Date(a.startDate || a.createdAt).getTime();
        const dateB = new Date(b.startDate || b.createdAt).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
    });
    
    return result;
  }, [tickets, searchName, searchSuratTugas, filterDate, filterMonth, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTickets.slice(start, start + itemsPerPage);
  }, [filteredTickets, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchName, searchSuratTugas, filterDate, filterMonth, sortBy, sortOrder]);

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus perjalanan dinas ini? Semua riwayat proses juga akan dihapus.')) return;
    try {
      await api.delete(`/tickets/${id}`);
      fetchTickets();
    } catch (error) {
      console.error(error);
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredTickets.map(ticket => {
      const stepInfo = getCurrentStepInfo(ticket);
      return {
        ticketNumber: ticket.ticketNumber,
        activityName: ticket.activityName,
        assignmentLetterNumber: ticket.assignmentLetterNumber,
        startDate: ticket.startDate,
        isLs: ticket.isLs,
        currentStep: ticket.currentStep,
        status: ticket.status,
        currentPIC: stepInfo.userName,
        currentRole: stepInfo.role,
      };
    });
    const filename = `PD_Aktif_${new Date().toISOString().split('T')[0]}`;
    exportToExcel(exportData, filename);
  };

  const handleExportPDF = () => {
    const exportData = filteredTickets.map(ticket => {
      const stepInfo = getCurrentStepInfo(ticket);
      return {
        ticketNumber: ticket.ticketNumber,
        activityName: ticket.activityName,
        assignmentLetterNumber: ticket.assignmentLetterNumber,
        startDate: ticket.startDate,
        isLs: ticket.isLs,
        currentStep: ticket.currentStep,
        status: ticket.status,
        currentPIC: stepInfo.userName,
        currentRole: stepInfo.role,
      };
    });
    const filename = `PD_Aktif_${new Date().toISOString().split('T')[0]}`;
    exportToPDF(exportData, filename, 'Data Perjalanan Dinas Aktif');
  };

  useEffect(() => {
    fetchTickets();
    fetchStepConfigs();
    fetchUsers();
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.isLs === '') {
      alert('Pilih jenis PD (LS atau Non-LS)');
      return;
    }
    setLoading(true);
    try {
      const fullLetterNumber = buildLetterNumber();
      await api.post('/tickets', {
        ...form,
        assignmentLetterNumber: fullLetterNumber,
        isLs: form.isLs === 'true',
      });
      setOpen(false);
      setForm({
        activityName: '',
        uraian: '',
        startDate: new Date().toISOString().split('T')[0],
        isLs: '',
        assignedPpdUserId1: '',
        assignedPpdUserId2: '',
      });
      setTemplateInputs({});
      fetchTickets();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Perjalanan Dinas Aktif</h1>
          <p className="text-slate-500">Perjalanan dinas yang sedang dalam proses</p>
        </div>
        <div className="flex gap-2">
          {/* Export Buttons */}
          <Button
            onClick={handleExportExcel}
            disabled={filteredTickets.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <Button
            onClick={handleExportPDF}
            disabled={filteredTickets.length === 0}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          {user?.systemRole === 'admin' && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Buat PD
                </Button>
              </DialogTrigger>
            <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle>Buat Perjalanan Dinas Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nama Kegiatan</Label>
                  <Input
                    value={form.activityName}
                    onChange={(e) =>
                      setForm({ ...form, activityName: e.target.value })
                    }
                    placeholder="Nama kegiatan..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nomor Surat Tugas</Label>
                  {template ? (
                    <div className="flex flex-wrap items-center gap-1">
                      {template.split(/(\{\d+\})/g).map((part, idx) => {
                        if (part.match(/^\{\d+\}$/)) {
                          const placeholders: Record<string, string> = {
                            '{1}': 'Nomor...',
                            '{2}': 'Bulan...',
                            '{3}': 'Tahun...',
                          };
                          return (
                            <Input
                              key={idx}
                              value={templateInputs[part] || ''}
                              onChange={(e) => setTemplateInputs({ ...templateInputs, [part]: e.target.value })}
                              placeholder={placeholders[part] || `Isi ${part}`}
                              className="w-24 flex-shrink-0"
                              required
                            />
                          );
                        }
                        return part ? <span key={idx} className="text-sm text-slate-500 whitespace-nowrap">{part}</span> : null;
                      })}
                    </div>
                  ) : (
                    <Input
                      value={templateInputs['{1}'] || ''}
                      onChange={(e) => setTemplateInputs({ '{1}': e.target.value })}
                      placeholder="Nomor surat tugas..."
                      required
                    />
                  )}
                  {template && buildLetterNumber() && (
                    <p className="text-xs text-slate-400 mt-1">
                      Preview: <span className="font-mono">{buildLetterNumber()}</span>
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Uraian (Opsional)</Label>
                  <Input
                    value={form.uraian}
                    onChange={(e) =>
                      setForm({ ...form, uraian: e.target.value })
                    }
                    placeholder="Deskripsi tambahan..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Penerimaan Berkas</Label>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm({ ...form, startDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Jenis PD</Label>
                  <Select value={form.isLs} onValueChange={(v: 'true' | 'false') => setForm({ ...form, isLs: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis PD" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">LS (Langsung) - Bendahara</SelectItem>
                      <SelectItem value="false">Non-LS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Pelaksana Perjalanan Dinas 1</Label>
                  <Select value={form.assignedPpdUserId1} onValueChange={(v) => setForm({ ...form, assignedPpdUserId1: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih PPD 1..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users.filter(u => u.employeeRole === 'PPD').map(u => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Pelaksana Perjalanan Dinas 2</Label>
                  <Select value={form.assignedPpdUserId2} onValueChange={(v) => setForm({ ...form, assignedPpdUserId2: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih PPD 2..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users.filter(u => u.employeeRole === 'PPD').map(u => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </div>

      {/* Filter & Sort */}
      <Card>
        <CardContent className="px-4">
          <div className="flex items-end mb-4">
            <div className="flex-[6] pr-2">
              <Label className="text-xs text-slate-500 mb-1.5 block">Cari Kegiatan</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Nama kegiatan..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
            </div>
            <div className="flex-[3] pr-2">
              <Label className="text-xs text-slate-500 mb-1.5 block">No. Surat Tugas</Label>
              <Input
                placeholder="Cari..."
                value={searchSuratTugas}
                onChange={(e) => setSearchSuratTugas(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="flex-[2] pr-2">
              <Label className="text-xs text-slate-500 mb-1.5 block">Tgl Penerimaan Berkas</Label>
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="flex-[1] pr-2">
              <Label className="text-xs text-slate-500 mb-1.5 block">Bulan</Label>
              <Input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="flex-[1] pr-2">
              <Label className="text-xs text-slate-500 mb-1.5 block">Urutkan</Label>
              <Select value={sortBy} onValueChange={(v: 'name' | 'date' | 'ls' | 'status' | 'month') => setSortBy(v)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Tanggal</SelectItem>
                  <SelectItem value="month">Bulan</SelectItem>
                  <SelectItem value="name">Nama</SelectItem>
                  <SelectItem value="ls">LS</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-[1]">
              <Label className="text-xs text-slate-500 mb-1.5 block">Urutan</Label>
              <Select value={sortOrder} onValueChange={(v: 'asc' | 'desc') => setSortOrder(v)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descending</SelectItem>
                  <SelectItem value="asc">Ascending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(searchName || searchSuratTugas || filterDate || filterMonth) && (
              <Button 
                size="sm"
                className="ml-2 h-9 bg-slate-800 text-white hover:bg-slate-700"
                onClick={() => { setSearchName(''); setSearchSuratTugas(''); setFilterDate(''); setFilterMonth(''); }}
              >
                Reset
              </Button>
            )}
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b bg-slate-100">
                  <TableHead className="border-r min-w-[200px]">Kegiatan</TableHead>
                  <TableHead className="border-r">No. Surat Tugas</TableHead>
                  <TableHead className="border-r">Tanggal Penerimaan Berkas</TableHead>
                  <TableHead className="border-r">LS</TableHead>
                  <TableHead className="border-r">Step</TableHead>
                  <TableHead className="border-r">Role PIC</TableHead>
                  <TableHead className="border-r">Nama PIC</TableHead>
                  <TableHead className="border-r">Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTickets.map((ticket) => {
                  const currentStepInfo = getCurrentStepInfo(ticket);
                  // Check if ticket has return message at current step
                  const hasReturnMessage = ticket.histories.some(
                    h => h.stepNumber === ticket.currentStep && h.processorName?.includes('[DIKEMBALIKAN]')
                  );
                  const returnMessage = ticket.histories.find(
                    h => h.stepNumber === ticket.currentStep && h.processorName?.includes('[DIKEMBALIKAN]')
                  );
                  
                  return (
                  <TableRow key={ticket.id} className={`border-b last:border-b-0 ${hasReturnMessage ? 'bg-red-50' : ''}`}>
                    <TableCell className="border-r max-w-[300px]">
                      <div className="space-y-1">
                        <div className="truncate" title={ticket.activityName}>
                          {ticket.activityName}
                        </div>
                        {hasReturnMessage && returnMessage && (
                          <div className="flex items-center gap-1 text-xs text-red-700">
                            <Badge className="bg-red-500 text-white text-xs px-1.5 py-0">
                              ⚠️ DIKEMBALIKAN
                            </Badge>
                            <span className="truncate" title={returnMessage.notes || ''}>
                              {returnMessage.notes?.substring(0, 50)}...
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="border-r whitespace-nowrap">
                      {ticket.assignmentLetterNumber}
                    </TableCell>
                    <TableCell className="border-r whitespace-nowrap">
                      {new Date(ticket.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="border-r">
                      <Badge variant={ticket.isLs ? 'default' : 'secondary'}>
                        {ticket.isLs ? 'LS' : 'Non-LS'}
                      </Badge>
                    </TableCell>
                    <TableCell className="border-r">
                      <span className="text-sm">
                        {ticket.currentStep > getMaxStep() ? 'Selesai' : `${ticket.currentStep}/${getTotalSteps()}`}
                      </span>
                    </TableCell>
                    <TableCell className="border-r whitespace-nowrap">
                      <span className="text-sm">
                        {ticket.status === 'completed' ? '-' : currentStepInfo.role}
                      </span>
                    </TableCell>
                    <TableCell className="border-r whitespace-nowrap">
                      <span className="text-sm">
                        {ticket.status === 'completed' ? '-' : currentStepInfo.userName}
                      </span>
                    </TableCell>
                    <TableCell className="border-r">
                      <div className="flex flex-col gap-1">
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
                        {hasReturnMessage && (
                          <Badge className="bg-red-500 text-white text-xs">
                            Dikembalikan
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Link href={`/tickets/${ticket.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        {user?.systemRole === 'admin' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDelete(ticket.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="relative flex items-center mt-10">
            <p className="text-xs text-slate-500">
              Menampilkan {paginatedTickets.length} dari {filteredTickets.length} perjalanan dinas
            </p>
            {totalPages > 1 && (
              <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
                <Button
                  size="sm"
                  className="bg-slate-800 text-white hover:bg-slate-700 disabled:bg-slate-300"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  size="sm"
                  className="bg-slate-800 text-white hover:bg-slate-700 disabled:bg-slate-300"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
