'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EMPLOYEE_ROLES, SYSTEM_ROLES } from '@/lib/constants';
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';

interface User {
  id: string;
  username: string;
  name: string;
  systemRole: string;
  employeeRole: string | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    email: '', // kept as 'email' for API compatibility, but used as username
    password: '',
    name: '',
    systemRole: 'employee',
    employeeRole: 'VER',
  });

  const fetchUsers = () => {
    api.get('/users').then((res) => setUsers(res.data));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const resetForm = () => {
    setForm({
      email: '',
      password: '',
      name: '',
      systemRole: 'employee',
      employeeRole: 'VER',
    });
    setEditUser(null);
    setShowPassword(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (editUser) {
        await api.put(`/users/${editUser.id}`, form);
      } else {
        await api.post('/users', form);
      }
      setOpen(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      console.error(error);
      // Handle specific error messages
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.error || 'Username sudah digunakan';
        setError(errorMessage);
      } else if (error.response?.status === 500) {
        setError('Terjadi kesalahan server. Silakan coba lagi.');
      } else {
        setError('Gagal menyimpan user. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditUser(user);
    setForm({
      email: user.username,
      password: '',
      name: user.name,
      systemRole: user.systemRole,
      employeeRole: user.employeeRole || 'VER',
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus user ini?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manajemen User</h1>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tambah User
            </Button>
          </DialogTrigger>
          <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>
                {editUser ? 'Edit User' : 'Tambah User Baru'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                  <p className="font-medium">Error</p>
                  <p className="text-red-600 mt-1">{error}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label>Nama</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Masukkan nama"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Masukan username"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Password {editUser && '(kosongkan jika tidak diubah)'}</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Masukkan password"
                    required={!editUser}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>System Role</Label>
                <Select
                  value={form.systemRole}
                  onValueChange={(v) => setForm({ ...form, systemRole: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SYSTEM_ROLES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.systemRole === 'employee' && (
                <div className="space-y-2">
                  <Label>Employee Role</Label>
                  <Select
                    value={form.employeeRole}
                    onValueChange={(v) => setForm({ ...form, employeeRole: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EMPLOYEE_ROLES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b bg-slate-100">
                  <TableHead className="border-r">Nama</TableHead>
                  <TableHead className="border-r">Username</TableHead>
                  <TableHead className="border-r">System Role</TableHead>
                  <TableHead className="border-r">Employee Role</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="border-b last:border-b-0">
                    <TableCell className="font-medium border-r">{user.name}</TableCell>
                    <TableCell className="border-r">{user.username}</TableCell>
                    <TableCell className="border-r">
                      <Badge variant="outline">
                        {SYSTEM_ROLES[user.systemRole]}
                      </Badge>
                    </TableCell>
                    <TableCell className="border-r">
                      {user.employeeRole && (
                        <Badge>{EMPLOYEE_ROLES[user.employeeRole]}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(user)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(user.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
