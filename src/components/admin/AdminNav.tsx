
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, Map, Calendar, Users, Store, UserCog } from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';


const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/locations', label: 'Locations', icon: Map },
  { href: '/admin/events', label: 'Events', icon: Calendar },
  { href: '/admin/groups', label: 'Groups', icon: Users },
  { href: '/admin/products', label: 'Products', icon: Store },
  { href: '/admin/users', label: 'Users', icon: UserCog },
];

export function AdminNav() {
  const pathname = usePathname();
  
  return (
    <div className="border-b bg-background mb-6">
        <Tabs value={pathname} className="w-full">
        <TabsList className="flex flex-wrap w-full rounded-none bg-transparent p-0 h-auto">
            {adminNavItems.map((item) => (
            <TabsTrigger
                key={item.href}
                value={item.href}
                asChild
                className="flex-1 rounded-none border-b-2 border-transparent py-4 data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:shadow-none"
            >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Link>
            </TabsTrigger>
            ))}
        </TabsList>
        </Tabs>
    </div>
  );
}
