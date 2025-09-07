"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { Edit, Trash2, UserPlus, Shield, Building, Phone, Mail, User, Lock } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface UserType {
  id?: number;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'employee' | 'manager';
  branch: 'laban' | 'tuwaiq' | 'both' | 'headquarters';
  permissions: {
    canViewRevenues: boolean;
    canEditRevenues: boolean;
    canViewExpenses: boolean;
    canEditExpenses: boolean;
    canViewBonus: boolean;
    canEditBonus: boolean;
    canViewReports: boolean;
    canManageUsers: boolean;
    canManageRequests: boolean;
    canCreateRequests: boolean;
    canApproveRequests: boolean;
    canManageProducts: boolean;
  };
  title?: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
}

const defaultPermissions = {
  admin: {
    canViewRevenues: true,
    canEditRevenues: true,
    canViewExpenses: true,
    canEditExpenses: true,
    canViewBonus: true,
    canEditBonus: true,
    canViewReports: true,
    canManageUsers: true,
    canManageRequests: true,
    canCreateRequests: true,
    canApproveRequests: true,
    canManageProducts: true,
  },
  manager: {
    canViewRevenues: true,
    canEditRevenues: true,
    canViewExpenses: true,
    canEditExpenses: false,
    canViewBonus: true,
    canEditBonus: false,
    canViewReports: true,
    canManageUsers: false,
    canManageRequests: true,
    canCreateRequests: true,
    canApproveRequests: true,
    canManageProducts: true,
  },
  employee: {
    canViewRevenues: true,
    canEditRevenues: false,
    canViewExpenses: true,
    canEditExpenses: false,
    canViewBonus: false,
    canEditBonus: false,
    canViewReports: false,
    canManageUsers: false,
    canManageRequests: false,
    canCreateRequests: true,
    canApproveRequests: false,
    canManageProducts: false,
  }
};

export default function UsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);
  const [formData, setFormData] = useState<UserType>({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    branch: 'laban',
    permissions: defaultPermissions.employee,
    title: '',
    phone: '',
    isActive: true
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'فشل تحميل المستخدمين' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = editingUser ? '/api/users' : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingUser ? { ...formData, id: editingUser.id } : formData)
      });

      if (response.ok) {
        toast({ title: editingUser ? 'تم تحديث المستخدم بنجاح' : 'تم إضافة المستخدم بنجاح' });
        setDialogOpen(false);
        resetForm();
        fetchUsers();
      } else {
        const error = await response.json();
        toast({ variant: 'destructive', title: error.error || 'حدث خطأ' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'فشل حفظ المستخدم' });
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users?id=${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast({ title: 'تم حذف المستخدم بنجاح' });
        setDeleteDialogOpen(false);
        setUserToDelete(null);
        fetchUsers();
      } else {
        toast({ variant: 'destructive', title: 'فشل حذف المستخدم' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'فشل حذف المستخدم' });
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'employee',
      branch: 'laban',
      permissions: defaultPermissions.employee,
      title: '',
      phone: '',
      isActive: true
    });
  };

  const openEditDialog = (user: UserType) => {
    setEditingUser(user);
    setFormData({ ...user, password: '' });
    setDialogOpen(true);
  };

  const openDeleteDialog = (user: UserType) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleRoleChange = (role: 'admin' | 'employee' | 'manager') => {
    setFormData({
      ...formData,
      role,
      permissions: defaultPermissions[role]
    });
  };

  const updatePermission = (permission: string, value: boolean) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [permission]: value
      }
    });
  };

  const getRoleBadge = (role: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      admin: 'default',
      manager: 'secondary',
      employee: 'outline'
    };
    const labels: { [key: string]: string } = {
      admin: 'مدير النظام',
      manager: 'مدير',
      employee: 'موظف'
    };
    return <Badge variant={variants[role] || 'outline'}>{labels[role] || role}</Badge>;
  };

  const getBranchBadge = (branch: string) => {
    const labels: { [key: string]: string } = {
      laban: 'فرع لبن',
      tuwaiq: 'فرع طويق',
      both: 'كلا الفرعين',
      headquarters: 'الإدارة العامة'
    };
    return <Badge variant="secondary">{labels[branch] || branch}</Badge>;
  };

  if (user?.role !== 'admin') {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">غير مصرح</h3>
          <p className="text-muted-foreground mt-2">ليس لديك صلاحية لعرض هذه الصفحة</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-headline font-bold mb-2">إدارة المستخدمين</h1>
          <p className="text-muted-foreground">إدارة حسابات المستخدمين وصلاحياتهم</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><UserPlus className="ml-2" />إضافة مستخدم</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingUser ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}</DialogTitle>
              <DialogDescription>
                {editingUser ? 'قم بتعديل بيانات المستخدم' : 'أدخل بيانات المستخدم الجديد'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name"><User className="inline w-4 h-4 ml-1" />الاسم</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="أدخل اسم المستخدم"
                  />
                </div>
                <div>
                  <Label htmlFor="email"><Mail className="inline w-4 h-4 ml-1" />البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password"><Lock className="inline w-4 h-4 ml-1" />كلمة المرور</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? 'اتركه فارغاً للإبقاء على القديم' : 'أدخل كلمة المرور'}
                  />
                </div>
                <div>
                  <Label htmlFor="phone"><Phone className="inline w-4 h-4 ml-1" />رقم الهاتف</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="05XXXXXXXX"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role"><Shield className="inline w-4 h-4 ml-1" />الدور</Label>
                  <Select value={formData.role} onValueChange={handleRoleChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">مدير النظام</SelectItem>
                      <SelectItem value="manager">مدير</SelectItem>
                      <SelectItem value="employee">موظف</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="branch"><Building className="inline w-4 h-4 ml-1" />الفرع</Label>
                  <Select value={formData.branch} onValueChange={(value: any) => setFormData({ ...formData, branch: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="laban">فرع لبن</SelectItem>
                      <SelectItem value="tuwaiq">فرع طويق</SelectItem>
                      <SelectItem value="both">كلا الفرعين</SelectItem>
                      <SelectItem value="headquarters">الإدارة العامة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="title">المسمى الوظيفي</Label>
                <Input
                  id="title"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="مثال: موظف مبيعات"
                />
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  id="active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="active">حساب نشط</Label>
              </div>

              <div className="space-y-2">
                <Label>الصلاحيات</Label>
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries({
                      canViewRevenues: 'عرض الإيرادات',
                      canEditRevenues: 'تعديل الإيرادات',
                      canViewExpenses: 'عرض المصروفات',
                      canEditExpenses: 'تعديل المصروفات',
                      canViewBonus: 'عرض البونص',
                      canEditBonus: 'تعديل البونص',
                      canViewReports: 'عرض التقارير',
                      canManageUsers: 'إدارة المستخدمين',
                      canManageRequests: 'إدارة الطلبات',
                      canCreateRequests: 'إنشاء طلبات',
                      canApproveRequests: 'اعتماد الطلبات',
                      canManageProducts: 'إدارة المنتجات'
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                          id={key}
                          checked={formData.permissions[key as keyof typeof formData.permissions]}
                          onCheckedChange={(checked) => updatePermission(key, checked as boolean)}
                        />
                        <Label htmlFor={key} className="text-sm font-normal cursor-pointer">
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>إلغاء</Button>
              <Button onClick={handleSubmit}>{editingUser ? 'تحديث' : 'إضافة'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المستخدم</TableHead>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>الفرع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    جاري التحميل...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    لا يوجد مستخدمون
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        {user.title && <div className="text-sm text-muted-foreground">{user.title}</div>}
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getBranchBadge(user.branch)}</TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'default' : 'destructive'}>
                        {user.isActive ? 'نشط' : 'معطل'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(user)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف المستخدم "{userToDelete?.name}"؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleDelete}>حذف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}