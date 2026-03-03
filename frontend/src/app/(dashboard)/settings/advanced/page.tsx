'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Plus, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EMPLOYEE_ROLES } from '@/lib/constants';

interface StepConfig {
  id: number;
  stepNumber: number;
  stepName: string;
  requiredEmployeeRole: string;
  isLsOnly: boolean;
  isNonLsOnly: boolean;
}

// Konfigurasi per-rule selisih: step mana, role mana, dan berlaku untuk tiket tipe apa
interface SelisihRule {
  stepNumber: number;
  role: string;
  ticketType: 'all' | 'ls' | 'non_ls'; // semua, hanya LS, hanya Non-LS
}

export default function AdvancedSettingsPage() {
  const [template, setTemplate] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Selisih configuration
  const [steps, setSteps] = useState<StepConfig[]>([]);
  const [selisihRules, setSelisihRules] = useState<SelisihRule[]>([]);
  const [selisihLoading, setSelisihLoading] = useState(false);
  const [selisihSaved, setSelisihSaved] = useState(false);

  // New rule form
  const [newRuleStep, setNewRuleStep] = useState<string>('');
  const [newRuleRole, setNewRuleRole] = useState<string>('');
  const [newRuleTicketType, setNewRuleTicketType] = useState<'all' | 'ls' | 'non_ls'>('ls');

  useEffect(() => {
    api.get('/settings').then((res) => {
      setTemplate(res.data.letterNumberTemplate || '');
      // Parse selisih config dari settings
      try {
        const raw = res.data.selisihConfig;
        if (raw) {
          setSelisihRules(JSON.parse(raw));
        }
      } catch {
        setSelisihRules([]);
      }
    });
    api.get('/steps').then((res) => setSteps(res.data));
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    try {
      await api.post('/settings/bulk', {
        letterNumberTemplate: template,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSelisih = async () => {
    setSelisihLoading(true);
    setSelisihSaved(false);
    try {
      await api.post('/settings/bulk', {
        selisihConfig: JSON.stringify(selisihRules),
      });
      setSelisihSaved(true);
      setTimeout(() => setSelisihSaved(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setSelisihLoading(false);
    }
  };

  const handleAddRule = () => {
    if (!newRuleStep || !newRuleRole) {
      alert('Pilih step dan role terlebih dahulu');
      return;
    }
    const stepNum = parseInt(newRuleStep);
    // Cek duplikat
    const exists = selisihRules.some(
      r => r.stepNumber === stepNum && r.role === newRuleRole && r.ticketType === newRuleTicketType
    );
    if (exists) {
      alert('Kombinasi step, role, dan tipe tiket ini sudah ada');
      return;
    }
    setSelisihRules([...selisihRules, { stepNumber: stepNum, role: newRuleRole, ticketType: newRuleTicketType }]);
    setNewRuleStep('');
    setNewRuleRole('');
    setNewRuleTicketType('ls');
  };

  const handleRemoveRule = (index: number) => {
    setSelisihRules(selisihRules.filter((_, i) => i !== index));
  };

  // Parse template to show preview
  const getPreviewParts = () => {
    if (!template) return [];
    const parts = template.split(/(\{\d+\})/g);
    return parts;
  };

  const previewValues: Record<string, string> = { '{1}': '001', '{2}': '10', '{3}': '2026' };
  const previewResult = template.replace(/\{(\d+)\}/g, (match) => previewValues[match] || match);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan Lanjutan</h1>
        <p className="text-slate-500">Konfigurasi sistem aplikasi</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Format Nomor Surat Tugas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-500">
            Buat template nomor surat dengan placeholder. Gunakan <code className="bg-slate-100 px-1 rounded">{'{1}'}</code>, <code className="bg-slate-100 px-1 rounded">{'{2}'}</code>, dst untuk bagian yang diisi user. Teks lainnya akan menjadi bagian tetap.
          </p>
          
          <div className="space-y-2">
            <Label>Template Nomor Surat</Label>
            <Input
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder="Contoh: {1}/KPPN/{2}/2026"
            />
            <p className="text-xs text-slate-400">
              Contoh format: {'{1}'}/KPPN/{'{2}'}/2026 atau ST-{'{1}'}/{'{2}'}/BLM
            </p>
          </div>

          {template && (
            <div className="bg-slate-50 p-4 rounded-lg border space-y-3">
              <p className="text-sm text-slate-500">Preview User Input:</p>
              <div className="flex flex-wrap items-center gap-1">
                {getPreviewParts().map((part, idx) => {
                  if (part.match(/^\{\d+\}$/)) {
                    return (
                      <span key={idx} className="font-mono bg-blue-100 text-blue-700 px-2 py-1 rounded border border-blue-200">
                        {previewValues[part] || part}
                      </span>
                    );
                  }
                  return <span key={idx} className="text-slate-600">{part}</span>;
                })}
              </div>
              <p className="text-sm mt-2">
                Hasil: <span className="font-mono bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200">{previewResult}</span>
              </p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
            {saved && <span className="text-green-600 text-sm">Tersimpan!</span>}
          </div>
        </CardContent>
      </Card>

      {/* Konfigurasi Selisih Anggaran */}
      <Card>
        <CardHeader>
          <CardTitle>Konfigurasi Selisih Anggaran</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-slate-500">
            Atur pada <strong>step mana</strong> dan <strong>role mana</strong> fitur pilihan{' '}
            <span className="font-semibold text-blue-700">Selisih Nihil / Selisih Kurang / Selisih Lebih</span>{' '}
            akan muncul saat memproses tiket, beserta tipe tiket yang berlaku.
          </p>

          {/* Daftar rule yang sudah ada */}
          {selisihRules.length === 0 ? (
            <div className="text-sm text-slate-400 italic py-2">
              Belum ada konfigurasi selisih. Tambahkan rule di bawah.
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-slate-600">Rule yang Aktif</Label>
              <div className="divide-y divide-slate-100 border rounded-lg overflow-hidden">
                {selisihRules.map((rule, idx) => {
                  const stepInfo = steps.find(s => s.stepNumber === rule.stepNumber);
                  return (
                    <div key={idx} className={`flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 border-l-4 ${
                      stepInfo?.isLsOnly
                        ? 'border-l-blue-400'
                        : stepInfo?.isNonLsOnly
                        ? 'border-l-orange-400'
                        : 'border-l-slate-300'
                    }`}>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`font-mono ${
                            stepInfo?.isLsOnly
                              ? 'border-blue-300 text-blue-700 bg-blue-50'
                              : stepInfo?.isNonLsOnly
                              ? 'border-orange-300 text-orange-700 bg-orange-50'
                              : 'border-slate-300 text-slate-600'
                          }`}
                        >
                          Step {rule.stepNumber}
                          {stepInfo?.isLsOnly && <span className="ml-1 text-[9px] font-bold">LS</span>}
                          {stepInfo?.isNonLsOnly && <span className="ml-1 text-[9px] font-bold">Non-LS</span>}
                        </Badge>
                        <span className="text-sm font-medium text-slate-700">
                          {EMPLOYEE_ROLES[rule.role] || rule.role}
                        </span>
                        {stepInfo && (
                          <span className="text-xs text-slate-400">({stepInfo.stepName})</span>
                        )}
                        <Badge
                          className={
                            rule.ticketType === 'ls'
                              ? 'bg-blue-100 text-blue-700 border-blue-200'
                              : rule.ticketType === 'non_ls'
                              ? 'bg-orange-100 text-orange-700 border-orange-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }
                          variant="outline"
                        >
                          {rule.ticketType === 'ls' ? '🏦 Hanya LS' : rule.ticketType === 'non_ls' ? '📋 Hanya Non-LS' : '🔄 Semua Tipe'}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRule(idx)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Form tambah rule baru */}
          <div className="space-y-3 border border-dashed border-slate-300 rounded-lg p-4 bg-slate-50">
            <Label className="text-slate-700 font-semibold">Tambah Rule Baru</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Step</Label>
                <Select value={newRuleStep} onValueChange={(v) => {
                  setNewRuleStep(v);
                  // Auto-set tipe tiket sesuai sifat step yang dipilih
                  const picked = steps.find(s => String(s.stepNumber) === v);
                  if (picked?.isLsOnly) setNewRuleTicketType('ls');
                  else if (picked?.isNonLsOnly) setNewRuleTicketType('non_ls');
                  else setNewRuleTicketType('all');
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih step" />
                  </SelectTrigger>
                  <SelectContent>
                    {steps.map((s) => (
                      <SelectItem key={s.stepNumber} value={String(s.stepNumber)}>
                        <span className="flex items-center gap-2">
                          <span
                            className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                              s.isLsOnly
                                ? 'bg-blue-500'
                                : s.isNonLsOnly
                                ? 'bg-orange-400'
                                : 'bg-slate-400'
                            }`}
                          />
                          Step {s.stepNumber} – {s.stepName}
                          {s.isLsOnly && (
                            <span className="ml-1 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded px-1">LS</span>
                          )}
                          {s.isNonLsOnly && (
                            <span className="ml-1 text-[10px] font-semibold text-orange-600 bg-orange-50 border border-orange-200 rounded px-1">Non-LS</span>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Keterangan warna */}
                <div className="flex items-center gap-3 pt-1">
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500" /> LS Only
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <span className="inline-block w-2 h-2 rounded-full bg-orange-400" /> Non-LS Only
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <span className="inline-block w-2 h-2 rounded-full bg-slate-400" /> Semua
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Role</Label>
                <Select value={newRuleRole} onValueChange={setNewRuleRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EMPLOYEE_ROLES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Berlaku untuk</Label>
                <Select
                  value={newRuleTicketType}
                  onValueChange={(v) => setNewRuleTicketType(v as 'all' | 'ls' | 'non_ls')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ls">Hanya LS</SelectItem>
                    <SelectItem value="non_ls">Hanya Non-LS</SelectItem>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={handleAddRule} className="mt-1">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Rule
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleSaveSelisih} disabled={selisihLoading}>
              <Save className="w-4 h-4 mr-2" />
              {selisihLoading ? 'Menyimpan...' : 'Simpan Konfigurasi Selisih'}
            </Button>
            {selisihSaved && <span className="text-green-600 text-sm">Tersimpan!</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
