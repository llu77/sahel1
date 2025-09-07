"use client";

import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Briefcase } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Logo from '@/components/ui/logo';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@sahl.com");
  const [password, setPassword] = useState("Admin1230");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        login(data.user, data.token);
        toast({
          title: `مرحباً ${data.user.name}`,
          description: "تم تسجيل دخولك بنجاح.",
        });
      } else {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "فشل تسجيل الدخول",
          description: error.error || "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ في الاتصال",
        description: "حدث خطأ أثناء محاولة تسجيل الدخول.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-2xl shadow-primary/10">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Logo width={150} height={60} />
          </div>
          <CardTitle className="font-headline text-2xl">نظام سهل</CardTitle>
          <CardDescription>سجل الدخول إلى حسابك للمتابعة</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@sahl.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                disabled={loading}
                placeholder="أدخل كلمة المرور"
              />
            </div>
            <Button type="submit" className="w-full font-semibold" disabled={loading}>
              {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              <p>للاختبار:</p>
              <p>البريد: admin@sahl.com</p>
              <p>كلمة المرور: Admin1230</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}