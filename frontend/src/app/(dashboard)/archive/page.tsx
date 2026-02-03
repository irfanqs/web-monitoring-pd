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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, Trash2, Search, ChevronLeft, ChevronRight, FileSpreadsheet, FileText } from 'lucide-react';
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
  histories: Array<{
    stepNumber: number;
    processorName: string;
    processedAt: string;
  }>;
}

export default function ArchivePage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stepConfigs, setStepConfigs] = useState<StepConfig[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const { user } = useAuthStore();

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
      activityName: ticket.activityName,
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
      activityName: ticket.activityName,
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
              <Label className="text-xs text-slate-500 mb-1.5 block">Tanggal Penerimaan Berkas</Label>
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="flex-[2] pr-2">
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
                    <TableRow key={ticket.id} className="border-b last:border-b-0">
                      <TableCell className="border-r max-w-[300px]">
                        <div className="truncate" title={ticket.activityName}>
                          {ticket.activityName}
                        </div>
                      </TableCell>
                      <TableCell className="border-r whitespace-nowrap">
                        {ticket.assignmentLetterNumber}
                      </TableCell>
                      <TableCell className="border-r">
                        <Badge variant={ticket.isLs ? 'default' : 'secondary'}>
                          {ticket.isLs ? 'LS' : 'Non-LS'}
                        </Badge>
                      </TableCell>
                      <TableCell className="border-r whitespace-nowrap">
                        {new Date(ticket.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
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
    </div>
  );
}
