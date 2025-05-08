
'use client'; // Add 'use client' as it was likely intended for the full auth form

// import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Uncommented necessary imports
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { useToast } from '@/hooks/use-toast';
// import { useRouter } from 'next/navigation';
// import { Loader2 } from 'lucide-react';

export default function AuthPage() {
  // const [email, setEmail] = useState('');
  // const [password, setPassword] = useState('');
  // const [name, setName] = useState('');
  // const [isLoading, setIsLoading] = useState(false);
  // const { toast } = useToast();
  // const router = useRouter();

  // const handleLogin = async () => {
  //   setIsLoading(true);
  //   try {
  //     const response = await fetch('/api/auth/login', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ email, password }),
  //     });

  //     const data = await response.json();

  //     if (!response.ok) {
  //       throw new Error(data.error || 'Login failed');
  //     }

  //     toast({ title: 'Login Successful', description: 'Welcome back!' });
  //     router.push('/'); // Redirect to home page
  //     router.refresh(); // Force refresh to update auth state in layout/page

  //   } catch (error: any) {
  //     toast({ variant: 'destructive', title: 'Login Error', description: error.message });
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // const handleSignup = async () => {
  //   setIsLoading(true);
  //   try {
  //     const response = await fetch('/api/auth/signup', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ email, password, name }),
  //     });

  //     const data = await response.json();

  //     if (!response.ok) {
  //       throw new Error(data.error || 'Signup failed');
  //     }

  //     toast({ title: 'Signup Successful', description: 'Welcome! Please log in.' });
  //     // Optionally switch to login tab after signup
  //     // For now, just show success and let user log in

  //   } catch (error: any) {
  //     toast({ variant: 'destructive', title: 'Signup Error', description: error.message });
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  return (
     <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary/30">
        {/* Commented out Tabs component */}
      {/*
       <Tabs defaultValue="login" className="w-[400px]">
         <TabsList className="grid w-full grid-cols-2">
           <TabsTrigger value="login">Login</TabsTrigger>
           <TabsTrigger value="signup">Sign Up</TabsTrigger>
         </TabsList>
         <TabsContent value="login">
           <Card>
             <CardHeader>
               <CardTitle>Login</CardTitle>
               <CardDescription>Enter your email and password to access your account.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="space-y-1">
                 <Label htmlFor="login-email">Email</Label>
                 <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
               </div>
               <div className="space-y-1">
                 <Label htmlFor="login-password">Password</Label>
                 <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
               </div>
             </CardContent>
             <CardFooter>
               <Button className="w-full" onClick={handleLogin} disabled={isLoading}>
                 {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                 Login
               </Button>
             </CardFooter>
           </Card>
         </TabsContent>
         <TabsContent value="signup">
           <Card>
             <CardHeader>
               <CardTitle>Sign Up</CardTitle>
               <CardDescription>Create a new account to get started.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="space-y-1">
                 <Label htmlFor="signup-name">Name</Label>
                 <Input id="signup-name" value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} />
               </div>
               <div className="space-y-1">
                 <Label htmlFor="signup-email">Email</Label>
                 <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
               </div>
               <div className="space-y-1">
                 <Label htmlFor="signup-password">Password</Label>
                 <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
               </div>
             </CardContent>
             <CardFooter>
               <Button className="w-full" onClick={handleSignup} disabled={isLoading}>
                 {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                 Sign Up
               </Button>
             </CardFooter>
           </Card>
         </TabsContent>
       </Tabs>
       */}
        <Card className="w-[400px] bg-card text-card-foreground shadow-lg rounded-xl">
          <CardHeader className="p-6">
            <CardTitle className="text-xl font-semibold">Authentication Disabled</CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">Login and Sign Up features are currently unavailable.</CardDescription>
          </CardHeader>
        </Card>
     </div>
   );
}
