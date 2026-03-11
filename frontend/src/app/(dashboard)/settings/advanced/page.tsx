'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Plus, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
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

// Konfigurasi step mana yang mengisi tanggal terima berkas
interface ReceivedDateConfig {
  lsStepNumber: number | null;    // step untuk tiket LS
  nonLsStepNumber: number | null; // step untuk tiket Non-LS
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

  // Received date configuration
  const [receivedDateConfig, setReceivedDateConfig] = useState<ReceivedDateConfig>({ lsStepNumber: null, nonLsStepNumber: null });
  const [receivedDateLoading, setReceivedDateLoading] = useState(false);
  const [receivedDateSaved, setReceivedDateSaved] = useState(false);

  // Download config: step mana yang bisa download file
  const [downloadStepsLs, setDownloadStepsLs] = useState<number[]>([]);
  const [downloadStepsNonLs, setDownloadStepsNonLs] = useState<number[]>([]);
  const [downloadConfigLoading, setDownloadConfigLoading] = useState(false);
  const [downloadConfigSaved, setDownloadConfigSaved] = useState(false);

  useEffect(() => {
    api.get('/settings').then((res) => {
      setTemplate(res.data.letterNumberTemplate || '');
      // Parse selisih config dari settings
      try {
        const raw = res.data.selisihConfig;
        if (raw) {
          const parsed = JSON.parse(raw);
          setSelisihRules(Array.isArray(parsed) ? parsed : []);
        } else {
          setSelisihRules([]);
        }
      } catch {
        setSelisihRules([]);
      }
      // Parse received date config
      try {
        const raw = res.data.receivedDateConfig;
        if (raw) {
          const parsed = JSON.parse(raw);
          setReceivedDateConfig({
            lsStepNumber: parsed.lsStepNumber ?? null,
            nonLsStepNumber: parsed.nonLsStepNumber ?? null,
          });
        }
      } catch {
        setReceivedDateConfig({ lsStepNumber: null, nonLsStepNumber: null });
      }
      // Parse download config
      try {
        const raw = res.data.downloadConfig;
        if (raw) {
          const parsed = JSON.parse(raw);
          setDownloadStepsLs(Array.isArray(parsed.ls) ? parsed.ls : []);
          setDownloadStepsNonLs(Array.isArray(parsed.nonLs) ? parsed.nonLs : []);
        }
      } catch {
        setDownloadStepsLs([]);
        setDownloadStepsNonLs([]);
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

  const handleSaveReceivedDate = async (updated: ReceivedDateConfig) => {
    setReceivedDateLoading(true);
    setReceivedDateSaved(false);
    try {
      await api.post('/settings/bulk', {
        receivedDateConfig: JSON.stringify(updated),
      });
      setReceivedDateConfig(updated);
      setReceivedDateSaved(true);
      setTimeout(() => setReceivedDateSaved(false), 2500);
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan konfigurasi tanggal terima berkas.');
    } finally {
      setReceivedDateLoading(false);
    }
  };

  const handleToggleDownloadStep = async (stepNumber: number, ticketType: 'ls' | 'nonLs') => {
    const current = ticketType === 'ls' ? downloadStepsLs : downloadStepsNonLs;
    const updated = current.includes(stepNumber)
      ? current.filter(s => s !== stepNumber)
      : [...current, stepNumber].sort((a, b) => a - b);

    const newLs = ticketType === 'ls' ? updated : downloadStepsLs;
    const newNonLs = ticketType === 'nonLs' ? updated : downloadStepsNonLs;

    setDownloadConfigLoading(true);
    setDownloadConfigSaved(false);
    try {
      await api.post('/settings/bulk', {
        downloadConfig: JSON.stringify({ ls: newLs, nonLs: newNonLs }),
      });
      if (ticketType === 'ls') setDownloadStepsLs(newLs);
      else setDownloadStepsNonLs(newNonLs);
      setDownloadConfigSaved(true);
      setTimeout(() => setDownloadConfigSaved(false), 2500);
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan konfigurasi download.');
    } finally {
      setDownloadConfigLoading(false);
    }
  };

  // Helper: simpan rules ke DB dan update state
  const saveRulesToDB = async (rules: SelisihRule[]) => {
    setSelisihLoading(true);
    setSelisihSaved(false);
    try {
      await api.post('/settings/bulk', {
        selisihConfig: JSON.stringify(rules),
      });
      setSelisihRules(rules);
      setSelisihSaved(true);
      setTimeout(() => setSelisihSaved(false), 2500);
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan konfigurasi selisih. Pastikan Anda login sebagai admin.');
    } finally {
      setSelisihLoading(false);
    }
  };

  const handleAddRule = async () => {
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
    const newRules = [...selisihRules, { stepNumber: stepNum, role: newRuleRole, ticketType: newRuleTicketType }];
    await saveRulesToDB(newRules);
    // Reset form setelah berhasil
    setNewRuleStep('');
    setNewRuleRole('');
    setNewRuleTicketType('ls');
  };

  const handleRemoveRule = async (index: number) => {
    const newRules = selisihRules.filter((_, i) => i !== index);
    await saveRulesToDB(newRules);
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
            <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              ⚠️ Belum ada konfigurasi selisih aktif. Fitur pilihan selisih anggaran <strong>tidak akan muncul</strong> saat memproses tiket. Tambahkan rule di bawah.
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
                          {rule.ticketType === 'ls' ? 'Hanya LS' : rule.ticketType === 'non_ls' ? 'Hanya Non-LS' : 'Semua Tipe'}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRule(idx)}
                        disabled={selisihLoading}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        {selisihLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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

            <Button variant="outline" size="sm" onClick={handleAddRule} disabled={selisihLoading} className="mt-1">
              {selisihLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {selisihLoading ? 'Menyimpan...' : 'Tambah Rule'}
            </Button>
            {selisihSaved && (
              <div className="flex items-center gap-1 text-green-600 text-sm mt-2">
                <CheckCircle2 className="w-4 h-4" />
                Tersimpan!
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Konfigurasi Tanggal Terima Berkas */}
      <Card>
        <CardHeader>
          <CardTitle>Konfigurasi Tanggal Terima Berkas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-slate-500">
            Atur pada <strong>step mana</strong> field <span className="font-semibold text-blue-700">Tanggal Terima Berkas</span> akan muncul saat memproses tiket, terpisah untuk tiket <span className="font-semibold text-blue-600">LS</span> dan <span className="font-semibold text-orange-600">Non-LS</span>.
            Jika tidak dikonfigurasi, field tidak akan muncul.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* LS */}
            <div className="space-y-2 border rounded-lg p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between mb-1">
                <Label className="font-semibold text-blue-800">Tiket LS</Label>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200" variant="outline">LS</Badge>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Step yang mengisi tanggal terima berkas</Label>
                <Select
                  value={receivedDateConfig.lsStepNumber !== null ? String(receivedDateConfig.lsStepNumber) : '__none__'}
                  onValueChange={(v) => {
                    const updated = { ...receivedDateConfig, lsStepNumber: v === '__none__' ? null : parseInt(v) };
                    handleSaveReceivedDate(updated);
                  }}
                  disabled={receivedDateLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tidak dikonfigurasi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Tidak dikonfigurasi —</SelectItem>
                    {steps.filter(s => !s.isNonLsOnly).map((s) => (
                      <SelectItem key={s.stepNumber} value={String(s.stepNumber)}>
                        Step {s.stepNumber} – {s.stepName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {receivedDateConfig.lsStepNumber !== null && (
                <p className="text-xs text-blue-700 mt-1">
                  Field tanggal muncul di <strong>Step {receivedDateConfig.lsStepNumber}</strong> untuk tiket LS
                </p>
              )}
            </div>

            {/* Non-LS */}
            <div className="space-y-2 border rounded-lg p-4 bg-orange-50 border-orange-200">
              <div className="flex items-center justify-between mb-1">
                <Label className="font-semibold text-orange-800">Tiket Non-LS</Label>
                <Badge className="bg-orange-100 text-orange-700 border-orange-200" variant="outline">Non-LS</Badge>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Step yang mengisi tanggal terima berkas</Label>
                <Select
                  value={receivedDateConfig.nonLsStepNumber !== null ? String(receivedDateConfig.nonLsStepNumber) : '__none__'}
                  onValueChange={(v) => {
                    const updated = { ...receivedDateConfig, nonLsStepNumber: v === '__none__' ? null : parseInt(v) };
                    handleSaveReceivedDate(updated);
                  }}
                  disabled={receivedDateLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tidak dikonfigurasi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Tidak dikonfigurasi —</SelectItem>
                    {steps.filter(s => !s.isLsOnly).map((s) => (
                      <SelectItem key={s.stepNumber} value={String(s.stepNumber)}>
                        Step {s.stepNumber} – {s.stepName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {receivedDateConfig.nonLsStepNumber !== null && (
                <p className="text-xs text-orange-700 mt-1">
                  Field tanggal muncul di <strong>Step {receivedDateConfig.nonLsStepNumber}</strong> untuk tiket Non-LS
                </p>
              )}
            </div>
          </div>

          {receivedDateLoading && (
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Menyimpan...
            </div>
          )}
          {receivedDateSaved && (
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Tersimpan!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Konfigurasi Akses Download File */}
      <Card>
        <CardHeader>
          <CardTitle>Konfigurasi Akses Download File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-slate-500">
            Centang step mana saja yang diizinkan melihat dan mendownload file dari step-step sebelumnya saat memproses tiket.
            Konfigurasi terpisah untuk tiket <span className="font-semibold text-blue-600">LS</span> dan <span className="font-semibold text-orange-600">Non-LS</span>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* LS */}
            <div className="border rounded-lg p-4 bg-blue-50 border-blue-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-blue-800">Tiket LS</span>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200" variant="outline">LS</Badge>
              </div>
              {steps.filter(s => !s.isNonLsOnly).length === 0 ? (
                <p className="text-xs text-slate-400 italic">Belum ada step LS</p>
              ) : (
                <div className="space-y-2">
                  {steps.filter(s => !s.isNonLsOnly).map(s => (
                    <label key={s.stepNumber} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={downloadStepsLs.includes(s.stepNumber)}
                        onChange={() => handleToggleDownloadStep(s.stepNumber, 'ls')}
                        disabled={downloadConfigLoading}
                        className="w-4 h-4 accent-blue-600"
                      />
                      <span className="text-sm text-slate-700 group-hover:text-blue-700">
                        <span className="font-mono text-xs bg-blue-100 text-blue-700 rounded px-1 mr-1">
                          {s.stepNumber}
                        </span>
                        {s.stepName}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Non-LS */}
            <div className="border rounded-lg p-4 bg-orange-50 border-orange-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-orange-800">Tiket Non-LS</span>
                <Badge className="bg-orange-100 text-orange-700 border-orange-200" variant="outline">Non-LS</Badge>
              </div>
              {steps.filter(s => !s.isLsOnly).length === 0 ? (
                <p className="text-xs text-slate-400 italic">Belum ada step Non-LS</p>
              ) : (
                <div className="space-y-2">
                  {steps.filter(s => !s.isLsOnly).map(s => (
                    <label key={s.stepNumber} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={downloadStepsNonLs.includes(s.stepNumber)}
                        onChange={() => handleToggleDownloadStep(s.stepNumber, 'nonLs')}
                        disabled={downloadConfigLoading}
                        className="w-4 h-4 accent-orange-600"
                      />
                      <span className="text-sm text-slate-700 group-hover:text-orange-700">
                        <span className="font-mono text-xs bg-orange-100 text-orange-700 rounded px-1 mr-1">
                          {s.stepNumber}
                        </span>
                        {s.stepName}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {downloadConfigLoading && (
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Menyimpan...
            </div>
          )}
          {downloadConfigSaved && (
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Tersimpan!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
