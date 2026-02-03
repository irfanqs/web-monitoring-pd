'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!username || !password) {
        setError('Username dan password harus diisi');
        setLoading(false);
        return;
      }

      const { data } = await api.post('/auth/login', { username, password });
      setAuth(data.user, data.token);
      router.push('/dashboard');
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Username atau password salah');
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.error || 'Data tidak valid');
      } else if (err.message === 'Network Error') {
        setError('Tidak dapat terhubung ke server. Pastikan backend sudah running.');
      } else {
        setError(err.response?.data?.error || 'Login gagal. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Monitoring Dashboard</CardTitle>
          <p className="text-slate-500">Perjalanan Dinas</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm flex items-start gap-3">
                <div className="text-red-500 font-bold mt-0.5">!</div>
                <div>
                  <p className="font-medium">Login Gagal</p>
                  <p className="text-red-600 mt-1">{error}</p>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
