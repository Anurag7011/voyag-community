
'use client';
import React from 'react';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { getCountryGroupDocRef } from '@/lib/firestore';
import { type CountryGroup } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { LoginDialog } from '@/components/auth/LoginDialog';

export default function CountryGroupsPage({ params }: { params: { country: string } }) {
  const { country: countrySlug } = React.use(params);
  const firestore = useFirestore();
  const { user } = useUser();
  const groupRef = useMemoFirebase(() => getCountryGroupDocRef(firestore, countrySlug), [firestore, countrySlug]);
  const { data: country, isLoading } = useDoc<CountryGroup>(groupRef);


  if (isLoading) {
    return <CountryGroupSkeleton />;
  }

  if (!country) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="text-center mb-8">
        <span className="text-6xl">{country.flag}</span>
        <h1 className="text-3xl font-bold font-headline mt-4">
          {country.country} Community Groups
        </h1>
        <p className="text-muted-foreground mt-2">
          Join a group to connect with travelers in {country.country}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>City Groups</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {country.groups.map((group) => (
            <div key={group.city} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
              <span className="font-medium text-lg">{group.city}</span>
              {user ? (
                <Button asChild variant="outline">
                  <Link href={group.whatsappLink} target="_blank">
                    Join Group <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <LoginDialog triggerText="Join Group" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>
      
      <div className="text-center mt-8">
        <Button variant="link" asChild>
          <Link href="/groups">← Back to all countries</Link>
        </Button>
      </div>
    </div>
  );
}

function CountryGroupSkeleton() {
  return (
    <div className="container mx-auto max-w-2xl py-8 animate-pulse">
      <div className="text-center mb-8 space-y-4">
        <Skeleton className="h-16 w-16 rounded-full mx-auto" />
        <Skeleton className="h-8 w-1/2 mx-auto" />
        <Skeleton className="h-4 w-3/4 mx-auto" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
              <Skeleton className="h-5 w-1/4" />
              <Skeleton className="h-10 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
