'use client';
import { ChevronRight, Users } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { getCountryGroupsCollectionRef } from '@/lib/firestore';
import { type CountryGroup } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function GroupsPage() {
  const firestore = useFirestore();
  const groupsQuery = useMemoFirebase(() => getCountryGroupsCollectionRef(firestore), [firestore]);
  const { data: countryGroups, isLoading } = useCollection<CountryGroup>(groupsQuery);

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center bg-primary/10 text-primary p-3 rounded-full mb-4">
          <Users className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold font-headline">
          Community Groups
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Connect with fellow travelers! Join city-specific WhatsApp groups to ask questions, get tips, and meet up.
        </p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => <CountryCardSkeleton key={i} />)}
        </div>
      )}

      {!isLoading && countryGroups && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {countryGroups.map((country) => (
            <Link href={`/groups/${country.id}`} key={country.id}>
              <Card className="overflow-hidden group hover:shadow-lg transition-shadow duration-300">
                <div className="relative aspect-[16/9]">
                  <Image
                    src={country.image.imageUrl}
                    alt={country.country}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint={country.image.imageHint}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-4">
                    <h3 className="text-2xl font-bold text-white flex items-center">
                      <span className="mr-3 text-3xl">{country.flag}</span>
                      {country.country}
                    </h3>
                  </div>
                  <div className="absolute top-4 right-4 bg-background/80 p-2 rounded-full">
                    <ChevronRight className="h-5 w-5 text-foreground" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function CountryCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[16/9]">
        <Skeleton className="h-full w-full" />
      </div>
    </Card>
  );
}
