'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EMPLOYEE_ROLES } from '@/lib/constants';
import { Pencil, Trash2, Plus, ArrowUp, ArrowDown } from 'lucide-react';

interface StepConfig {
  id: number;
  stepNumber: number;
  stepName: string;
  requiredEmployeeRole: string;
  description: string;
  isLsOnly: boolean;
  isNonLsOnly: boolean;
  isParallel: boolean;
  parallelGroup: string | null;
}

const emptyForm = {
  stepNumber: 0,
  stepName: '',
  requiredEmployeeRole: '',
  description: '',
  isLsOnly: false,
  isNonLsOnly: false,
  isParallel: false,
  parallelGroup: '',
};

export default function StepsSettingsPage() {
  const [steps, setSteps] = useState<StepConfig[]>([]);
  const [editingStep, setEditingStep] = useState<StepConfig | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const fetchSteps = () => {
    api.get('/steps').then((res) => setSteps(res.data));
  };

  useEffect(() => {
    fetchSteps();
  }, []);

  const handleCreate = async () => {
    if (!form.stepName || !form.requiredEmployeeRole) {
      alert('Nama step dan role harus diisi');
      return;
    }
    setLoading(true);
    try {
      await api.post('/steps', {
        ...form,
        parallelGroup: form.parallelGroup || null,
      });
      setIsCreating(false);
      setForm(emptyForm);
      fetchSteps();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal membuat step');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingStep) return;
    setLoading(true);
    try {
      await api.put(`/steps/${editingStep.id}`, {
        ...form,
        parallelGroup: form.parallelGroup || null,
      });
      setEditingStep(null);
      setForm(emptyForm);
      fetchSteps();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal mengupdate step');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus step ini?')) return;
    try {
      await api.delete(`/steps/${id}`);
      fetchSteps();
    } catch (error) {
      console.error(error);
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newSteps = [...steps];
    const temp = newSteps[index].stepNumber;
    newSteps[index].stepNumber = newSteps[index - 1].stepNumber;
    newSteps[index - 1].stepNumber = temp;
    
    try {
      await api.post('/steps/reorder', {
        steps: newSteps.map(s => ({ id: s.id, stepNumber: s.stepNumber }))
      });
      fetchSteps();
    } catch (error) {
      console.error(error);
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === steps.length - 1) return;
    const newSteps = [...steps];
    const temp = newSteps[index].stepNumber;
    newSteps[index].stepNumber = newSteps[index + 1].stepNumber;
    newSteps[index + 1].stepNumber = temp;
    
    try {
      await api.post('/steps/reorder', {
        steps: newSteps.map(s => ({ id: s.id, stepNumber: s.stepNumber }))
      });
      fetchSteps();
    } catch (error) {
      console.error(error);
    }
  };

  const openEdit = (step: StepConfig) => {
    setEditingStep(step);
    setForm({
      stepNumber: step.stepNumber,
      stepName: step.stepName,
      requiredEmployeeRole: step.requiredEmployeeRole,
      description: step.description || '',
      isLsOnly: step.isLsOnly,
      isNonLsOnly: step.isNonLsOnly,
      isParallel: step.isParallel,
      parallelGroup: step.parallelGroup || '',
    });
  };

  const openCreate = () => {
    const maxStep = steps.length > 0 ? Math.max(...steps.map(s => s.stepNumber)) : 0;
    setIsCreating(true);
    setForm({ ...emptyForm, stepNumber: maxStep + 1 });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pengaturan Step</h1>
          <p className="text-slate-500">Atur urutan dan konfigurasi step workflow</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Step
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-100">
                <TableHead className="w-16">No</TableHead>
                <TableHead>Nama Step</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead className="w-32">Urutan</TableHead>
                <TableHead className="w-24">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {steps.map((step, index) => (
                <TableRow key={step.id}>
                  <TableCell className="font-medium">{step.stepNumber}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{step.stepName}</p>
                      <p className="text-xs text-slate-500 truncate max-w-xs">{step.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{EMPLOYEE_ROLES[step.requiredEmployeeRole] || step.requiredEmployeeRole}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {step.isLsOnly && <Badge className="bg-blue-500 text-xs">LS Only</Badge>}
                      {step.isNonLsOnly && <Badge className="bg-orange-500 text-xs">Non-LS Only</Badge>}
                      {step.isParallel && <Badge className="bg-purple-500 text-xs">Paralel</Badge>}
                      {!step.isLsOnly && !step.isNonLsOnly && <Badge variant="secondary" className="text-xs">Semua</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === steps.length - 1}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(step)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(step.id)} className="text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreating || !!editingStep} onOpenChange={() => { setIsCreating(false); setEditingStep(null); setForm(emptyForm); }}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{editingStep ? 'Edit Step' : 'Tambah Step Baru'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nomor Step</Label>
              <Input
                type="number"
                value={form.stepNumber || ''}
                onChange={(e) => setForm({ ...form, stepNumber: parseInt(e.target.value) || 0 })}
                className="w-24"
              />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.requiredEmployeeRole} onValueChange={(v) => setForm({ ...form, requiredEmployeeRole: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EMPLOYEE_ROLES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nama Step</Label>
              <Input
                value={form.stepName}
                onChange={(e) => setForm({ ...form, stepName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="space-y-3">
              <Label>Tipe Step</Label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isLsOnly}
                    onChange={(e) => setForm({ ...form, isLsOnly: e.target.checked, isNonLsOnly: e.target.checked ? false : form.isNonLsOnly })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Khusus LS saja</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isNonLsOnly}
                    onChange={(e) => setForm({ ...form, isNonLsOnly: e.target.checked, isLsOnly: e.target.checked ? false : form.isLsOnly })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Khusus Non-LS saja</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isParallel}
                    onChange={(e) => setForm({ ...form, isParallel: e.target.checked, parallelGroup: e.target.checked ? form.parallelGroup : '' })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Step Paralel (bisa dikerjakan bersamaan)</span>
                </label>
                {form.isParallel && (
                  <div className="ml-6 mt-2">
                    <Label className="text-sm text-slate-600">Nama Grup Paralel</Label>
                    <Input
                      value={form.parallelGroup}
                      onChange={(e) => setForm({ ...form, parallelGroup: e.target.value })}
                      placeholder="Contoh: A, B, atau nama grup lainnya"
                      className="mt-1"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Step dengan grup yang sama akan berjalan bersamaan
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={editingStep ? handleUpdate : handleCreate}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
