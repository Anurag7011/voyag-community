
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { getLocationsCollectionRef, getEventsCollectionRef, getProductsCollectionRef, getUsersCollectionRef } from '@/lib/firestore';
import { type Location, type Event, type Product, type User as UserType } from '@/lib/types';
import { Map, Calendar, Store, Users, Activity } from 'lucide-react';
import { AdminNav } from '@/components/admin/AdminNav';
import { useAdmin } from '@/hooks/useAdmin';

export default function AdminDashboardPage() {
    const firestore = useFirestore();
    const { isAdmin, isAdminLoading } = useAdmin();
    const { isUserLoading } = useUser();
    
    const locationsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return getLocationsCollectionRef(firestore);
    }, [firestore]);
    const { data: locations } = useCollection<Location>(locationsQuery);

    const eventsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return getEventsCollectionRef(firestore);
    }, [firestore]);
    const { data: events } = useCollection<Event>(eventsQuery);

    const productsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return getProductsCollectionRef(firestore);
    }, [firestore]);
    const { data: products } = useCollection<Product>(productsQuery);

    const usersQuery = useMemoFirebase(() => {
        // Only fetch users if the current user is an admin and auth has loaded
        if (isAdminLoading || isUserLoading || !isAdmin || !firestore) return null;
        return getUsersCollectionRef(firestore);
    }, [firestore, isAdmin, isAdminLoading, isUserLoading]);
    const { data: users } = useCollection<UserType>(usersQuery);

  return (
    <div className="space-y-6">
        <AdminNav />
      <Card>
        <CardHeader>
          <CardTitle>Welcome, Admin!</CardTitle>
          <CardDescription>
            This is your control center for managing the VOYAĠ community and content.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <p>From here you can moderate posts, manage events, update the store, and oversee user groups. </p>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
                <Map className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{locations?.length ?? '...'}</div>
                <p className="text-xs text-muted-foreground">User-submitted spots</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{events?.length ?? '...'}</div>
                 <p className="text-xs text-muted-foreground">Community-hosted events</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{products?.length ?? '...'}</div>
                <p className="text-xs text-muted-foreground">Items in the store</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{users?.length ?? '...'}</div>
                <p className="text-xs text-muted-foreground">Registered community members</p>
            </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Quick Guide</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong className="text-foreground">Content Management:</strong> Use the tabs above to view and manage all submitted locations, events, store products, and community groups.
          </p>
           <p>
            <strong className="text-foreground">User Roles:</strong> As the app owner, you can assign and revoke admin privileges from the 'Users' page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
