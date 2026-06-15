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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Eye, Pencil, Trash2, Search, ChevronLeft, ChevronRight, FileSpreadsheet, FileText } from 'lucide-react';
import { EMPLOYEE_ROLES } from '@/lib/constants';
import { exportArchiveToExcel, exportArchiveToPDF } from '@/lib/exportUtils';

interface StepConfig {
  stepNumber: number;
  stepName: string;
  requiredEmployeeRole: string;
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
    stepNumber: number;
    processorName: string;
    processedAt: string;
  }>;
}

export default function ArchivePage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stepConfigs, setStepConfigs] = useState<StepConfig[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string; employeeRole: string | null }>>([]);
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const { user } = useAuthStore();

  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [editForm, setEditForm] = useState({
    activityName: '',
    assignmentLetterNumber: '',
    uraian: '',
    startDate: '',
    createdAt: '',
    assignedPpdUserId1: '',
    assignedPpdUserId2: '',
  });

  // Filter & Sort states
  const [searchName, setSearchName] = useState('');
  const [searchSuratTugas, setSearchSuratTugas] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'ls' | 'month'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const fetchTickets = () => {
    api.get('/tickets').then((res) => {
      // Filter only completed tickets
      const completedTickets = res.data.filter((t: Ticket) => t.status === 'completed');
      setTickets(completedTickets);
      
      // Get unique years from tickets based on startDate
      const yearSet = new Set<number>();
      completedTickets.forEach((t: Ticket) => {
        yearSet.add(new Date(t.startDate).getFullYear());
      });
      const ticketYears = Array.from(yearSet).sort((a, b) => b - a);
      
      if (ticketYears.length > 0) {
        setYears(ticketYears);
        if (!ticketYears.includes(selectedYear)) {
          setSelectedYear(ticketYears[0]);
        }
      } else {
        setYears([new Date().getFullYear()]);
      }
    });
  };

  const fetchStepConfigs = () => {
    api.get('/steps').then((res) => setStepConfigs(res.data));
  };

  const fetchUsers = () => {
    api.get('/users').then((res) => setUsers(res.data));
  };

  const handleOpenEdit = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setEditForm({
      activityName: ticket.activityName,
      assignmentLetterNumber: ticket.assignmentLetterNumber,
      uraian: ticket.uraian || '',
      startDate: ticket.startDate ? ticket.startDate.split('T')[0] : '',
      createdAt: ticket.createdAt ? ticket.createdAt.split('T')[0] : '',
      assignedPpdUserId1: ticket.assignedPpdUser1?.id || '',
      assignedPpdUserId2: ticket.assignedPpdUser2?.id || '',
    });
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTicket) return;
    const cleanActivityName = editForm.activityName.replace(/\s+/g, ' ').trim();
    if (!cleanActivityName) { alert('Nama kegiatan wajib diisi'); return; }
    if (cleanActivityName.length > 250) { alert('Nama kegiatan maksimal 250 karakter'); return; }
    if (!editForm.assignmentLetterNumber.trim()) { alert('Nomor surat tugas wajib diisi'); return; }
    if (editForm.assignedPpdUserId1 && editForm.assignedPpdUserId2 && editForm.assignedPpdUserId1 === editForm.assignedPpdUserId2) {
      alert('Pelaksana Perjalanan Dinas 1 dan 2 harus berbeda');
      return;
    }
    setEditLoading(true);
    try {
      await api.patch(`/tickets/${editingTicket.id}`, {
        activityName: cleanActivityName,
        assignmentLetterNumber: editForm.assignmentLetterNumber.trim(),
        uraian: editForm.uraian.trim(),
        startDate: editForm.startDate || undefined,
        createdAt: editForm.createdAt || undefined,
        assignedPpdUserId1: editForm.assignedPpdUserId1 || null,
        assignedPpdUserId2: editForm.assignedPpdUserId2 || null,
      });
      setEditOpen(false);
      setEditingTicket(null);
      fetchTickets();
    } catch {
      alert('Gagal menyimpan perubahan');
    } finally {
      setEditLoading(false);
    }
  };

  // Get current step info (who needs to process next)
  const getCurrentStepInfo = (ticket: Ticket) => {
    const stepConfig = stepConfigs.find(s => s.stepNumber === ticket.currentStep);
    if (!stepConfig) {
      return { role: '-', stepName: '-' };
    }
    const roleName = stepConfig.requiredEmployeeRole 
      ? EMPLOYEE_ROLES[stepConfig.requiredEmployeeRole] || stepConfig.requiredEmployeeRole
      : '-';
    return {
      role: roleName,
      stepName: stepConfig.stepName || '-',
    };
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus perjalanan dinas ini? Semua riwayat proses juga akan dihapus.')) return;
    try {
      await api.delete(`/tickets/${id}`);
      fetchTickets();
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchStepConfigs();
    fetchUsers();
  }, []);

  // Filter tickets by selected year based on startDate, then apply search/sort
  const filteredTickets = useMemo(() => {
    let result = tickets.filter(t => 
      new Date(t.startDate).getFullYear() === selectedYear
    );
    
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
      } else if (sortBy === 'month') {
        // Sort by year-month (YYYY-MM)
        const monthA = a.startDate ? a.startDate.substring(0, 7) : '';
        const monthB = b.startDate ? b.startDate.substring(0, 7) : '';
        const cmp = monthA.localeCompare(monthB);
        return sortOrder === 'asc' ? cmp : -cmp;
      } else {
        const dateA = new Date(a.startDate).getTime();
        const dateB = new Date(b.startDate).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
    });
    
    return result;
  }, [tickets, selectedYear, searchName, searchSuratTugas, filterDate, filterMonth, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTickets.slice(start, start + itemsPerPage);
  }, [filteredTickets, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear, searchName, searchSuratTugas, filterDate, filterMonth, sortBy, sortOrder]);

  // Count tickets per year (for display)
  const yearTicketCount = tickets.filter(t => 
    new Date(t.startDate).getFullYear() === selectedYear
  ).length;

  const handleExportExcel = () => {
    const exportData = filteredTickets.map(ticket => ({
      ticketNumber: ticket.ticketNumber,
      activityName: ticket.activityName.replace(/\s+/g, ' ').trim(),
      assignmentLetterNumber: ticket.assignmentLetterNumber,
      startDate: ticket.startDate,
      isLs: ticket.isLs,
      currentStep: ticket.currentStep,
      status: ticket.status,
      currentPIC: '-',
      currentRole: '-',
    }));
    const filename = `Arsip_PD_${selectedYear}_${new Date().toISOString().split('T')[0]}`;
    exportArchiveToExcel(exportData, filename);
  };

  const handleExportPDF = () => {
    const exportData = filteredTickets.map(ticket => ({
      ticketNumber: ticket.ticketNumber,
      activityName: ticket.activityName.replace(/\s+/g, ' ').trim(),
      assignmentLetterNumber: ticket.assignmentLetterNumber,
      startDate: ticket.startDate,
      isLs: ticket.isLs,
      currentStep: ticket.currentStep,
      status: ticket.status,
      currentPIC: '-',
      currentRole: '-',
    }));
    const filename = `Arsip_PD_${selectedYear}_${new Date().toISOString().split('T')[0]}`;
    exportArchiveToPDF(exportData, filename, `Arsip Perjalanan Dinas ${selectedYear}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Arsip Perjalanan Dinas</h1>
          <p className="text-slate-500">Perjalanan dinas yang sudah selesai diproses</p>
        </div>
        <div className="flex gap-2">
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
        </div>
      </div>

      {/* Year Tabs */}
      <div className="flex gap-2 border-b">
        {years.map((year) => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            className={`px-4 py-2 font-medium transition-colors ${
              selectedYear === year
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {year}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="px-4 pb-4">
          {/* Filter & Sort */}
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
              <Select value={sortBy} onValueChange={(v: 'name' | 'date' | 'ls' | 'month') => setSortBy(v)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Tanggal</SelectItem>
                  <SelectItem value="month">Bulan</SelectItem>
                  <SelectItem value="name">Nama</SelectItem>
                  <SelectItem value="ls">LS</SelectItem>
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

          {filteredTickets.length === 0 ? (
            <p className="text-center text-slate-500 py-8">
              Tidak ada perjalanan dinas arsip
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b bg-slate-100">
                    <TableHead className="border-r min-w-[200px]">Kegiatan</TableHead>
                    <TableHead className="border-r">No. Surat Tugas</TableHead>
                    <TableHead className="border-r">LS</TableHead>
                    <TableHead className="border-r">Tanggal Penerimaan Berkas</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTickets.map((ticket) => (
                    <TableRow
                      key={ticket.id}
                      className="group border-b last:border-b-0 cursor-pointer hover:bg-slate-50"
                      onClick={() => window.location.href = `/tickets/${ticket.id}`}
                    >
                      <TableCell className="border-r max-w-[300px]">
                        <div className="break-words whitespace-normal leading-snug group-hover:underline">
                          {ticket.activityName.replace(/\s+/g, ' ').trim()}
                        </div>
                      </TableCell>
                      <TableCell className="border-r whitespace-nowrap">
                        <span className="group-hover:underline">{ticket.assignmentLetterNumber}</span>
                      </TableCell>
                      <TableCell className="border-r">
                        <Badge variant={ticket.isLs ? 'default' : 'secondary'}>
                          {ticket.isLs ? 'LS' : 'Non-LS'}
                        </Badge>
                      </TableCell>
                      <TableCell className="border-r whitespace-nowrap">
                        {new Date(ticket.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <Link href={`/tickets/${ticket.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          {user?.systemRole === 'admin' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEdit(ticket)}
                                className="text-blue-500 hover:text-blue-700"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(ticket.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
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
      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Edit Perjalanan Dinas — {editingTicket?.ticketNumber}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Kegiatan</Label>
              <Input
                value={editForm.activityName}
                onChange={(e) => setEditForm((prev) => ({ ...prev, activityName: e.target.value.replace(/\s+/g, ' ') }))}
                maxLength={250}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Nomor Surat Tugas</Label>
              <Input
                value={editForm.assignmentLetterNumber}
                onChange={(e) => setEditForm((prev) => ({ ...prev, assignmentLetterNumber: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Uraian (Opsional)</Label>
              <Input
                value={editForm.uraian}
                onChange={(e) => setEditForm((prev) => ({ ...prev, uraian: e.target.value }))}
                placeholder="Deskripsi tambahan..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Mulai</Label>
                <Input
                  type="date"
                  value={editForm.startDate}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Tanggal PD Dibuat</Label>
                <Input
                  type="date"
                  value={editForm.createdAt}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, createdAt: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Pelaksana Perjalanan Dinas 1</Label>
              <SearchableSelect
                options={users.filter(u => u.employeeRole === 'PPD').map(u => ({ value: u.id, label: u.name }))}
                value={editForm.assignedPpdUserId1}
                onChange={(v) => setEditForm((prev) => ({ ...prev, assignedPpdUserId1: v }))}
                placeholder="Pilih PPD 1..."
              />
            </div>
            <div className="space-y-2">
              <Label>Pelaksana Perjalanan Dinas 2</Label>
              <SearchableSelect
                options={users.filter(u => u.employeeRole === 'PPD').map(u => ({ value: u.id, label: u.name }))}
                value={editForm.assignedPpdUserId2}
                onChange={(v) => setEditForm((prev) => ({ ...prev, assignedPpdUserId2: v }))}
                placeholder="Pilih PPD 2..."
              />
            </div>
            <Button type="submit" className="w-full" disabled={editLoading}>
              {editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
