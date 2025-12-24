
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  User,
  PlusCircle,
  Search,
  Home,
  Calendar,
  Users,
  Store,
  LogIn,
  Shield,
  Map,
} from 'lucide-react';
import { Logo } from './Logo';
import { Input } from '../ui/input';
import { useUser, useAuth, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { useAdmin } from '@/hooks/useAdmin';
import { getUserDocRef } from '@/lib/firestore';
import { type User as UserType } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { EditProfileForm } from '../profile/EditProfileForm';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/locations', label: 'Locations', icon: Map },
  { href: '/events', label: 'Events', icon: Calendar },
  { href: '/groups', label: 'Groups', icon: Users },
  { href: '/store', label: 'Store', icon: Store },
];

function ProfileSetupSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <div className="w-full max-w-2xl p-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/2 mx-auto" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <Skeleton className="h-24 w-24 rounded-full" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userRef = useMemoFirebase(() => {
    if (!user) return null;
    return getUserDocRef(firestore, user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserType>(userRef);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const query = e.currentTarget.value;
      if (query) {
        router.push(`/search?q=${encodeURIComponent(query)}`);
      }
    }
  };

  // 1. Initial auth check
  if (isUserLoading) {
    return <ProfileSetupSkeleton />;
  }

  // 2. If user is logged in, wait for their profile to load
  if (user && isProfileLoading) {
    return <ProfileSetupSkeleton />;
  }
  
  // 3. After profile has loaded, check if setup is needed
  // This check is now safe because we've already handled the loading states.
  if (user && userProfile && !userProfile.username) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/40">
         <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-center">Welcome to VOYAĠ!</CardTitle>
            <p className="text-center text-muted-foreground">Let's set up your profile.</p>
          </CardHeader>
          <CardContent>
            <EditProfileForm user={userProfile} isSetupMode={true} onSaved={() => router.push('/profile')} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // 4. Render the main app
  return (
    <div className="flex min-h-screen w-full flex-col">
        <header className="sticky top-0 z-10 border-b bg-background">
          {/* Main Header with Logo and UserNav */}
          <div className="flex h-16 items-center gap-4 px-4 md:px-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <Logo />
              <span className="font-headline text-3xl tracking-wide" style={{ fontFamily: "'VT323', monospace", letterSpacing: '0.1em' }}>VOYAĠ</span>
            </Link>

            <div className="ml-auto flex items-center gap-4">
              <UserNav />
            </div>
          </div>
          
          {/* Simple Navigation */}
          <nav className="flex justify-center border-b bg-muted/40">
            <div className="flex w-full max-w-5xl">
              {navItems.map(item => {
                  const isActive = (item.href === '/' && pathname === '/') || (item.href !== '/' && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-none border-b-2 border-transparent py-3 px-3 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        "hover:bg-background/80 hover:text-foreground",
                        isActive ? "border-primary bg-background text-foreground shadow-sm" : "text-muted-foreground"
                      )}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
            </div>
          </nav>

          {/* Search Bar */}
          <div className="p-4 bg-background">
            <div className="relative w-full max-w-4xl mx-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by People, country city or town."
                  className="w-full pl-10 pr-4 py-2 h-12 rounded-full shadow-sm"
                  onKeyDown={handleSearch}
                />
              </div>
          </div>

        </header>
      <main className='flex-1'>{children}</main>
    </div>
  );
}

function UserNav() {
  const { user, isUserLoading } = useUser();
  const { isAdmin } = useAdmin();
  const auth = useAuth();
  const router = useRouter();
  
  if (isUserLoading) {
    return <Skeleton className="h-10 w-10 rounded-full" />;
  }
  
  if (user) {
    const handleLogout = () => {
      if (auth) {
        auth.signOut();
      }
      router.push('/login');
    }

    const userName = user.displayName || 'New User';
    const userEmail = user.email || 'No email';
    const userAvatar = user.photoURL || 'https://i.pravatar.cc/150?u=' + user.uid;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={userAvatar}
                alt={userName}
                width={40}
                height={40}
              />
              <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{userName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {userEmail}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/add">
              <PlusCircle className="mr-2 h-4 w-4" />
              <span>Add Location</span>
            </Link>
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem asChild>
              <Link href="/admin">
                <Shield className="mr-2 h-4 w-4" />
                <span>Admin</span>
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button asChild>
      <Link href="/login">
        <LogIn className="mr-2 h-4 w-4" />
        Login
      </Link>
    </Button>
  );
}
