'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';

export default function AdvancedSettingsPage() {
  const [template, setTemplate] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/settings').then((res) => {
      setTemplate(res.data.letterNumberTemplate || '');
    });
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
    </div>
  );
}
