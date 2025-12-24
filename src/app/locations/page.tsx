
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { LocationCard } from '@/components/location/LocationCard';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type Location } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { getLocationsCollectionRef } from '@/lib/firestore';
import { Skeleton } from '@/components/ui/skeleton';


// Helper function to get the most engaging location from a group
const getFeaturedLocation = (locations: Location[]): Location => {
  if (!locations || locations.length === 0) {
    throw new Error("Cannot get featured location from an empty array.");
  }
  return locations.reduce((best, current) => {
    const bestScore = (best.likes ?? 0) + (best.reviews?.length ?? 0);
    const currentScore = (current.likes ?? 0) + (current.reviews?.length ?? 0);
    return currentScore > bestScore ? current : best;
  });
};


export default function LocationsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const firestore = useFirestore();

  const locationsQuery = useMemoFirebase(() => getLocationsCollectionRef(firestore), [firestore]);
  const { data: allLocations, isLoading } = useCollection<Location>(locationsQuery);

  const featuredLocations = useMemo(() => {
    if (isLoading || !allLocations) {
      return null;
    }
    // 1. Group locations by a unique key (e.g., 'City, Country')
    const groupedLocations = allLocations.reduce((acc, location) => {
      const key = `${location.city}, ${location.country}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(location);
      return acc;
    }, {} as Record<string, Location[]>);

    // 2. Find the most engaging post from each group
    const featured = Object.values(groupedLocations).map(getFeaturedLocation);
    
    // 3. Filter based on search term
    if (!searchTerm) {
      return featured;
    }
    return featured.filter(
      (location) =>
        location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.country.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allLocations, searchTerm, isLoading]);

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center mb-10">
            <Button asChild>
              <Link href="/add">
                <Plus className="mr-2 h-4 w-4" /> Add Location
              </Link>
            </Button>
          </div>
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex flex-col space-y-3">
                  <Skeleton className="h-[225px] w-full rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && featuredLocations && featuredLocations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredLocations.map((location) => (
                <LocationCard key={location.id} location={location} />
              ))}
            </div>
          ) : (
            !isLoading && <div className="text-center py-16">
              <p className="text-muted-foreground">No locations found. Try a different search.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
