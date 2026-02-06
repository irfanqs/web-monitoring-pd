'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f1f7fd] to-[#e3f2fd]">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-[#2880b9]">Monitoring Dashboard</CardTitle>
          <p className="text-[#444444]/70">Perjalanan Dinas</p>
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
              <Label htmlFor="username" className="text-[#444444]">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                required
                className="border-[#2880b9]/30 focus:border-[#2880b9] focus:ring-[#2880b9]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#444444]">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="pr-10 border-[#2880b9]/30 focus:border-[#2880b9] focus:ring-[#2880b9]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444444]/60 hover:text-[#2880b9] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full bg-[#2880b9] hover:bg-[#2880b9]/90 text-white" disabled={loading}>
              {loading ? 'Loading...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
