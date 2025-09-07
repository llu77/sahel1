"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  MessageSquare, 
  Clock, 
  AlertCircle,
  Bell,
  Filter,
  Search,
  FileText,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useRequests } from '@/contexts/requests-context';

interface RequestNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

export default function RequestsManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { requests, loading, fetchRequests, updateRequest } = useRequests();
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_review' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    fetchRequests();
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Count unread notifications
    const unread = requests.reduce((count: number, req: any) => {
      const unreadCount = req.notifications?.filter((n: RequestNotification) => !n.read).length || 0;
      return count + unreadCount;
    }, 0);
    setUnreadNotifications(unread);
  }, [requests]);

  const updateRequestStatus = async (requestId: number, status: string, notes?: string) => {
    setProcessingId(requestId);
    try {
      const response = await fetch(`/api/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          adminNotes: notes,
          reviewedBy: user?.name,
          reviewedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        const statusMessages: Record<string, string> = {
          'approved': 'تم قبول الطلب بنجاح',
          'rejected': 'تم رفض الطلب',
          'in_review': 'تم وضع الطلب قيد المراجعة'
        };
        
        toast({ 
          title: statusMessages[status],
          description: notes ? `مع ملاحظة: ${notes}` : undefined
        });
        
        fetchRequests();
        setNotesDialogOpen(false);
        setAdminNotes('');
      } else {
        toast({ variant: 'destructive', title: 'فشل تحديث الطلب' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'حدث خطأ أثناء تحديث الطلب' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleApprove = (request: any) => {
    setSelectedRequest(request);
    setAdminNotes('');
    setNotesDialogOpen(true);
  };

  const handleReject = (request: any) => {
    setSelectedRequest(request);
    setAdminNotes('');
    setNotesDialogOpen(true);
  };

  const handleView = (request: any) => {
    setSelectedRequest(request);
    setViewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: 'secondary',
      in_review: 'outline',
      approved: 'default',
      rejected: 'destructive'
    };
    
    const labels: Record<string, string> = {
      pending: 'قيد الانتظار',
      in_review: 'قيد المراجعة',
      approved: 'مقبول',
      rejected: 'مرفوض'
    };
    
    const icons: Record<string, React.ReactNode> = {
      pending: <Clock className="w-3 h-3 ml-1" />,
      in_review: <AlertCircle className="w-3 h-3 ml-1" />,
      approved: <CheckCircle className="w-3 h-3 ml-1" />,
      rejected: <XCircle className="w-3 h-3 ml-1" />
    };
    
    return (
      <Badge variant={variants[status] || 'outline'} className="flex items-center">
        {icons[status]}
        {labels[status] || status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    
    const labels: Record<string, string> = {
      low: 'منخفض',
      medium: 'متوسط',
      high: 'عالي',
      urgent: 'عاجل'
    };
    
    return (
      <Badge className={colors[priority] || 'bg-gray-100'}>
        {labels[priority] || priority}
      </Badge>
    );
  };

  const filteredRequests = requests.filter((request: any) => {
    const matchesFilter = filter === 'all' || request.status === filter;
    const matchesSearch = !searchTerm || 
      request.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter((r: any) => r.status === 'pending').length,
    inReview: requests.filter((r: any) => r.status === 'in_review').length,
    approved: requests.filter((r: any) => r.status === 'approved').length,
    rejected: requests.filter((r: any) => r.status === 'rejected').length
  };

  if (user?.role !== 'admin') {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
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
          <h1 className="text-3xl font-headline font-bold mb-2">إدارة الطلبات</h1>
          <p className="text-muted-foreground">مراجعة واعتماد طلبات الموظفين</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadNotifications > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Bell className="w-3 h-3" />
              {unreadNotifications} جديد
            </Badge>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">الكل</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">قيد الانتظار</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">قيد المراجعة</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inReview}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">مقبول</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">مرفوض</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في الطلبات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الطلبات</SelectItem>
                <SelectItem value="pending">قيد الانتظار</SelectItem>
                <SelectItem value="in_review">قيد المراجعة</SelectItem>
                <SelectItem value="approved">مقبول</SelectItem>
                <SelectItem value="rejected">مرفوض</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الطلب</TableHead>
                <TableHead>مقدم الطلب</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead>الأولوية</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    <p className="mt-2">جاري التحميل...</p>
                  </TableCell>
                </TableRow>
              ) : filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    لا يوجد طلبات
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request: any) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">#{request.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.employeeName}</div>
                        <div className="text-sm text-muted-foreground">{request.branch || 'عام'}</div>
                      </div>
                    </TableCell>
                    <TableCell>{request.type}</TableCell>
                    <TableCell>
                      <div className="max-w-[200px]">
                        <div className="font-medium truncate">{request.description}</div>
                        {request.amount && (
                          <div className="text-sm text-muted-foreground">
                            {request.amount.toLocaleString()} ريال
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getPriorityBadge(request.priority || 'medium')}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {request.createdAt ? format(new Date(request.createdAt), 'dd/MM/yyyy', { locale: ar }) : '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(request)}
                          title="عرض"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {request.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleApprove(request)}
                              disabled={processingId === request.id}
                              title="قبول"
                            >
                              {processingId === request.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleReject(request)}
                              disabled={processingId === request.id}
                              title="رفض"
                            >
                              {processingId === request.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedRequest(request);
                            setAdminNotes(request.adminNotes || '');
                            setNotesDialogOpen(true);
                          }}
                          title="إضافة ملاحظة"
                        >
                          <MessageSquare className="h-4 w-4" />
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

      {/* View Request Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل الطلب #{selectedRequest?.id}</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">مقدم الطلب</label>
                  <p className="font-medium">{selectedRequest.employeeName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">البريد الإلكتروني</label>
                  <p className="font-medium">{selectedRequest.employeeEmail}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">الفرع</label>
                  <p className="font-medium">{selectedRequest.branch || 'عام'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">النوع</label>
                  <p className="font-medium">{selectedRequest.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">الأولوية</label>
                  <div>{getPriorityBadge(selectedRequest.priority || 'medium')}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">الحالة</label>
                  <div>{getStatusBadge(selectedRequest.status)}</div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">الوصف</label>
                <p className="whitespace-pre-wrap">{selectedRequest.description}</p>
              </div>
              
              {selectedRequest.amount && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">المبلغ</label>
                  <p className="font-medium text-lg">{selectedRequest.amount.toLocaleString()} ريال</p>
                </div>
              )}
              
              {selectedRequest.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ملاحظات المستخدم</label>
                  <p className="whitespace-pre-wrap">{selectedRequest.notes}</p>
                </div>
              )}
              
              {selectedRequest.adminNotes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ملاحظات الإدارة</label>
                  <p className="whitespace-pre-wrap bg-muted p-3 rounded">
                    {selectedRequest.adminNotes}
                  </p>
                </div>
              )}
              
              {selectedRequest.reviewedBy && (
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>تمت المراجعة بواسطة: {selectedRequest.reviewedBy}</span>
                  {selectedRequest.reviewedAt && (
                    <span>
                      في: {selectedRequest.reviewedAt ? format(new Date(selectedRequest.reviewedAt), 'dd/MM/yyyy HH:mm', { locale: ar }) : '-'}
                    </span>
                  )}
                </div>
              )}
              
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>
                  تاريخ الإنشاء: {selectedRequest.createdAt ? format(new Date(selectedRequest.createdAt), 'dd/MM/yyyy HH:mm', { locale: ar }) : '-'}
                </span>
                {selectedRequest.updatedAt && (
                  <span>
                    آخر تحديث: {selectedRequest.updatedAt ? format(new Date(selectedRequest.updatedAt), 'dd/MM/yyyy HH:mm', { locale: ar }) : '-'}
                  </span>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة ملاحظة للطلب #{selectedRequest?.id}</DialogTitle>
            <DialogDescription>
              أضف ملاحظة لإرسالها إلى مقدم الطلب
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="اكتب ملاحظتك هنا..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (selectedRequest) {
                    updateRequestStatus(selectedRequest.id, 'in_review', adminNotes);
                  }
                }}
              >
                حفظ كقيد المراجعة
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  if (selectedRequest) {
                    updateRequestStatus(selectedRequest.id, 'approved', adminNotes);
                  }
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                قبول مع الملاحظة
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedRequest) {
                    updateRequestStatus(selectedRequest.id, 'rejected', adminNotes);
                  }
                }}
              >
                رفض مع الملاحظة
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}