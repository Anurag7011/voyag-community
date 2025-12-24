
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import {
  getUsersCollectionRef,
} from '@/lib/firestore';
import { type User as UserType, type Location } from '@/lib/types';
import { collection, query, where, or } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { LocationSearchResultCard } from '@/components/search/LocationSearchResultCard';
import { UserSearchResultCard } from '@/components/search/UserSearchResultCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function SearchResults() {
  const firestore = useFirestore();
  const { isUserLoading } = useUser();
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const lowerCaseQuery = q.toLowerCase();

  const usersQuery = useMemoFirebase(() => {
    if (isUserLoading || !firestore) return null;
    return getUsersCollectionRef(firestore);
  }, [firestore, isUserLoading]);
  

  const locationsQuery = useMemoFirebase(() => {
    if (!q || !firestore) return null;
    const locationsRef = collection(firestore, 'locations');
    return query(locationsRef, where('city', '>=', q), where('city', '<=', q + '\uf8ff'));
  }, [firestore, q]);

  const { data: users, isLoading: isLoadingUsers } = useCollection<UserType>(usersQuery);
  const { data: locations, isLoading: isLoadingLocations } = useCollection<Location>(locationsQuery);

  const isLoading = isUserLoading || isLoadingUsers || isLoadingLocations;

  const filteredUsers = users
    ? users.filter(user => 
        (user.displayName && user.displayName.toLowerCase().includes(lowerCaseQuery)) ||
        (user.username && user.username.toLowerCase().includes(lowerCaseQuery))
      )
    : [];

  const filteredLocations = locations
    ? locations.filter(location => 
        location.city.toLowerCase().includes(lowerCaseQuery) ||
        location.country.toLowerCase().includes(lowerCaseQuery)
      )
    : [];


  return (
    <div className="container mx-auto max-w-4xl py-8">
      <h1 className="text-2xl font-bold mb-2">Search Results for "{q}"</h1>
      <p className="text-muted-foreground mb-6">
        Found {filteredLocations?.length || 0} locations and {filteredUsers?.length || 0} people.
      </p>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <Tabs defaultValue="locations">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="locations">Locations ({filteredLocations?.length || 0})</TabsTrigger>
            <TabsTrigger value="people">People ({filteredUsers?.length || 0})</TabsTrigger>
          </TabsList>
          <TabsContent value="locations" className="mt-6 space-y-4">
            {filteredLocations && filteredLocations.length > 0 ? (
              filteredLocations.map(location => <LocationSearchResultCard key={location.id} location={location} />)
            ) : (
              <p className="text-center text-muted-foreground py-10">No locations found matching your search.</p>
            )}
          </TabsContent>
          <TabsContent value="people" className="mt-6 space-y-4">
            {filteredUsers && filteredUsers.length > 0 ? (
              filteredUsers.map(user => <UserSearchResultCard key={user.id} user={user} />)
            ) : (
              <p className="text-center text-muted-foreground py-10">No people found matching your search.</p>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}


export default function SearchPage() {
    return (
        <Suspense fallback={<SearchSkeleton />}>
            <SearchResults />
        </Suspense>
    )
}


function SearchSkeleton() {
    return (
      <div className="container mx-auto max-w-4xl py-8 animate-pulse">
        <Skeleton className="h-8 w-1/2 mb-2" />
        <Skeleton className="h-4 w-1/3 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }
