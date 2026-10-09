'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useRoleStore } from '@/lib/useRoleStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DurationSummary {
  count: number;
  averageMs: number;
  medianMs: number;
  minMs: number;
  maxMs: number;
}

interface StepDurationRow {
  stepNumber: number;
  stepName: string;
  requiredEmployeeRole: string;
  isLsOnly: boolean;
  isNonLsOnly: boolean;
  isParallel: boolean;
  summary: DurationSummary | null;
}

interface StepDurationResponse {
  year: number;
  type: TicketType;
  availableYears: number[];
  steps: StepDurationRow[];
  total: DurationSummary | null;
}

type TicketType = 'all' | 'ls' | 'nonls';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// Two largest units, e.g. "2 hari 3 jam", "3 jam 15 menit", "45 menit"
function formatDuration(ms: number) {
  if (ms < MINUTE) return '< 1 menit';
  const parts: string[] = [];
  const days = Math.floor(ms / DAY);
  const hours = Math.floor((ms % DAY) / HOUR);
  const minutes = Math.floor((ms % HOUR) / MINUTE);
  if (days) parts.push(`${days} hari`);
  if (hours) parts.push(`${hours} jam`);
  if (minutes) parts.push(`${minutes} menit`);
  return parts.slice(0, 2).join(' ');
}

export default function StatisticsPage() {
  const { user } = useAuthStore();
  const getRoleLabel = useRoleStore((state) => state.getRoleLabel);
  const [year, setYear] = useState(new Date().getFullYear());
  const [type, setType] = useState<TicketType>('all');
  const [result, setResult] = useState<{ key: string; data?: StepDurationResponse; error?: string } | null>(null);

  const isSupervisor = user?.systemRole === 'supervisor';
  const requestKey = `${year}-${type}`;
  const loading = result?.key !== requestKey;
  const error = loading ? '' : result?.error || '';
  // Keep the previous result visible (years list, table) while the next one loads
  const data = result?.data ?? null;

  useEffect(() => {
    if (!isSupervisor) return;
    api
      .get('/stats/step-durations', { params: { year, type } })
      .then((res) => setResult({ key: `${year}-${type}`, data: res.data }))
      .catch((err) =>
        setResult({ key: `${year}-${type}`, error: err.response?.data?.error || 'Gagal memuat statistik waktu' })
      );
  }, [year, type, isSupervisor]);

  if (!isSupervisor) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Statistik Waktu</h1>
        <p className="text-slate-700">Halaman ini hanya dapat dibuka oleh supervisor.</p>
      </div>
    );
  }

  const rows = data?.steps ?? [];
  const measured = rows.filter((r) => r.summary);
  const slowestAverage = measured.length > 0 ? Math.max(...measured.map((r) => r.summary!.averageMs)) : 0;
  const years = data?.availableYears ?? [year];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Statistik Waktu</h1>
        <p className="text-slate-700">
          Rata-rata lama pengerjaan tiap step dalam satu tahun.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="w-36">
          <Label className="text-xs text-slate-700 mb-1.5 block">Tahun selesai</Label>
          <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v, 10))}>
            <SelectTrigger className="h-9 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-44">
          <Label className="text-xs text-slate-700 mb-1.5 block">Jenis PD</Label>
          <Select value={type} onValueChange={(v: TicketType) => setType(v)}>
            <SelectTrigger className="h-9 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="ls">LS</SelectItem>
              <SelectItem value="nonls">Non-LS</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Rata-rata satu PD, dari dibuat sampai selesai</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-slate-700">Memuat...</p>
          ) : data?.total ? (
            <p>
              <span className="text-2xl font-bold">{formatDuration(data.total.averageMs)}</span>
              <span className="text-sm text-slate-700 ml-2">dari {data.total.count} PD yang selesai di {year}</span>
            </p>
          ) : (
            <p className="text-slate-700">Belum ada PD yang selesai di {year}.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lama pengerjaan per step</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-red-700 py-6 text-center">{error}. Muat ulang halaman untuk mencoba lagi.</p>
          ) : loading ? (
            <p className="text-slate-700 py-6 text-center">Memuat statistik...</p>
          ) : measured.length === 0 ? (
            <p className="text-slate-700 py-6 text-center">
              Belum ada step yang selesai dikerjakan di {year}. Statistik muncul setelah PD diproses.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100">
                    <TableHead className="w-14">Step</TableHead>
                    <TableHead className="min-w-[220px]">Role</TableHead>
                    <TableHead className="text-right">Dikerjakan</TableHead>
                    <TableHead className="min-w-[220px]">Rata-rata</TableHead>
                    <TableHead>Median</TableHead>
                    <TableHead>Tercepat</TableHead>
                    <TableHead>Terlama</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const s = row.summary;
                    const isSlowest = !!s && s.averageMs === slowestAverage;
                    return (
                      <TableRow key={row.stepNumber} className={isSlowest ? 'bg-amber-50' : undefined}>
                        <TableCell className="font-medium">{row.stepNumber}</TableCell>
                        <TableCell>
                          <div className="font-medium text-slate-900">{getRoleLabel(row.requiredEmployeeRole)}</div>
                          <div className="text-xs text-slate-700 flex flex-wrap gap-1 mt-0.5">
                            {row.stepName}
                            {row.isLsOnly && <Badge className="bg-blue-700 text-white text-[10px] px-1.5 py-0">LS</Badge>}
                            {row.isNonLsOnly && <Badge className="bg-orange-700 text-white text-[10px] px-1.5 py-0">Non-LS</Badge>}
                            {row.isParallel && <Badge className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] px-1.5 py-0">Paralel</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{s ? `${s.count}x` : '-'}</TableCell>
                        <TableCell>
                          {s ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900">{formatDuration(s.averageMs)}</span>
                                {isSlowest && <span className="text-xs font-semibold text-amber-900">Paling lama</span>}
                              </div>
                              <div className="h-1.5 bg-slate-100 rounded" aria-hidden>
                                <div
                                  className={isSlowest ? 'h-1.5 rounded bg-amber-600' : 'h-1.5 rounded bg-blue-900'}
                                  style={{ width: `${Math.max(2, (s.averageMs / slowestAverage) * 100)}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-700 text-sm">Belum ada data</span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{s ? formatDuration(s.medianMs) : '-'}</TableCell>
                        <TableCell className="whitespace-nowrap">{s ? formatDuration(s.minMs) : '-'}</TableCell>
                        <TableCell className="whitespace-nowrap">{s ? formatDuration(s.maxMs) : '-'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          <p className="text-xs text-slate-700 mt-4 leading-relaxed">
            Lama pengerjaan dihitung dari step sebelumnya selesai sampai step ini diklik proses, memakai jam kalender
            (malam dan hari libur ikut terhitung). Step paralel dihitung sejak PD dibuat. Jika PD dikembalikan,
            pengerjaan ulang dihitung sebagai pengerjaan terpisah. Skip oleh admin tidak dihitung.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
