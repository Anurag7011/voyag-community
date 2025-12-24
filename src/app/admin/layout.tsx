
'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  LogOut,
  Shield,
  Home,
  ShieldAlert,
} from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { useAuth, useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { Skeleton } from '@/components/ui/skeleton';
import { getDeletionRequestsCollectionRef } from '@/lib/firestore';
import { type DeletionRequest } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const { isAdmin, isOwner, isAdminLoading } = useAdmin();
  const auth = useAuth();
  const router = useRouter();
  const firestore = useFirestore();

  const deletionRequestsQuery = useMemoFirebase(() => {
    if (!isOwner || !firestore) return null;
    return getDeletionRequestsCollectionRef(firestore);
  }, [firestore, isOwner]);

  const { data: deletionRequests } = useCollection<DeletionRequest>(deletionRequestsQuery);

  const pendingRequestCount = deletionRequests?.filter(req => req.status === 'pending').length ?? 0;

  useEffect(() => {
    if (!isUserLoading && !isAdminLoading) {
      if (!user || !isAdmin) {
        router.push('/');
      }
    }
  }, [user, isUserLoading, isAdmin, isAdminLoading, router]);

  const handleLogout = () => {
    if (auth) {
      auth.signOut();
    }
    router.push('/login');
  };

  if (isUserLoading || isAdminLoading) {
    return <AdminLayoutSkeleton />;
  }

  if (!user || !isAdmin) {
    return null; // or a redirect component
  }

  const userName = user.displayName || 'Admin';
  const userAvatar = user.photoURL || '';

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
       <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-10">
          <Link href="/admin" className="flex items-center gap-2 font-semibold">
              <Logo />
              <span className="font-headline text-xl">VOYAĠ Admin</span>
          </Link>
          <Button variant="outline" size="sm" asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Back to App
            </Link>
          </Button>
          {isOwner && (
            <Button variant="secondary" size="sm" asChild>
                <Link href="/admin/moderation" className="relative">
                    <ShieldAlert className="mr-2 h-4 w-4" />
                    Moderation
                    {pendingRequestCount > 0 && (
                        <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 justify-center p-0">{pendingRequestCount}</Badge>
                    )}
                </Link>
            </Button>
          )}
          <div className="ml-auto flex items-center gap-3">
             <Avatar className="h-9 w-9">
                <AvatarImage src={userAvatar} alt={userName} />
                <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 truncate">
                <p className="text-sm font-semibold">{userName}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Shield className="h-3 w-3 text-green-500" /> {isOwner ? 'Owner' : 'Administrator'}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Log out">
                <LogOut className="h-4 w-4" />
            </Button>
          </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        {children}
      </main>
    </div>
  );
}


function AdminLayoutSkeleton() {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 animate-pulse">
            <Skeleton className="h-8 w-32" />
            <div className="ml-auto flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-24" />
                </div>
            </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">
            <Skeleton className="h-full w-full rounded-lg" />
        </main>
      </div>
    );
  }
