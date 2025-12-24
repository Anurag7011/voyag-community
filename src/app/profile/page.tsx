
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { useBucketList } from '@/context/BucketListContext';
import { LocationCard } from '@/components/location/LocationCard';
import { EventCard } from '@/components/event/EventCard';
import { Separator } from '@/components/ui/separator';
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { getLocationsByUserQuery, getEventsByIdsQuery, getLocationsByIdsQuery, getUserDocRef } from '@/lib/firestore';
import { type Location, type Event, type User as UserType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { EditProfileDialog } from '@/components/profile/EditProfileDialog';
import { Cake, User as UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

function calculateAge(dobString?: string) {
    if (!dobString) return null;
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
  

export default function ProfilePage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { bucketList } = useBucketList();

  const userRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return getUserDocRef(firestore, user.uid);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserType>(userRef);

  const userLocationsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return getLocationsByUserQuery(firestore, user.uid);
  }, [firestore, user]);

  const { data: userLocations, isLoading: isLoadingLocations } = useCollection<Location>(userLocationsQuery);
  
  // Separate bucket list items by type
  const [locationIds, setLocationIds] = useState<string[]>([]);
  const [eventIds, setEventIds] = useState<string[]>([]);

  useEffect(() => {
    setLocationIds(bucketList.filter(item => item.type === 'location').map(item => item.id));
    setEventIds(bucketList.filter(item => item.type === 'event').map(item => item.id));
  }, [bucketList]);

  // Create specific queries for saved items
  const savedLocationsQuery = useMemoFirebase(() => {
    if (!firestore || locationIds.length === 0) return null;
    return getLocationsByIdsQuery(firestore, locationIds);
  }, [firestore, locationIds]);

  const savedEventsQuery = useMemoFirebase(() => {
    if (!firestore || eventIds.length === 0) return null;
    return getEventsByIdsQuery(firestore, eventIds);
  }, [firestore, eventIds]);

  const { data: savedLocations, isLoading: isLoadingSavedLocations } = useCollection<Location>(savedLocationsQuery);
  const { data: savedEvents, isLoading: isLoadingSavedEvents } = useCollection<Event>(savedEventsQuery);


  if (isUserLoading || isProfileLoading) {
    return <ProfilePageSkeleton />;
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p>Please log in to view your profile.</p>
        <Button asChild className="mt-4">
          <Link href="/login">Login</Link>
        </Button>
      </div>
    );
  }

  if (!userProfile) {
     // This can happen briefly while the user doc is being created or if they have bypassed the setup.
     // The AppShell should handle forced setup.
     return <ProfilePageSkeleton />;
  }
  
  const userName = userProfile.name || 'New User';
  const userAvatarUrl = userProfile.avatar.imageUrl || `https://i.pravatar.cc/150?u=${user.uid}`;
  const userUsername = userProfile.username ? `@${userProfile.username}` : '';
  const userAge = calculateAge(userProfile.dob);

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col items-center mb-8">
        <Avatar className="h-32 w-32 mb-4 border-4 border-background shadow-lg">
          <AvatarImage
            src={userAvatarUrl}
            alt={userName}
            width={128}
            height={128}
            data-ai-hint={userProfile.avatar?.imageHint}
          />
          <AvatarFallback className="text-4xl">{userName.charAt(0)}</AvatarFallback>
        </Avatar>
        <h1 className="text-3xl font-bold font-headline">{userName}</h1>
        {userUsername && <p className="text-muted-foreground">{userUsername}</p>}
        
        <div className="flex items-center gap-6 mt-4">
            <div className="text-center">
                <p className="font-bold text-lg">{userLocations?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Posts</p>
            </div>
            <div className="text-center">
                <p className="font-bold text-lg">{userProfile.followers || 0}</p>
                <p className="text-sm text-muted-foreground">Followers</p>
            </div>
            <div className="text-center">
                <p className="font-bold text-lg">{userProfile.following || 0}</p>
                <p className="text-sm text-muted-foreground">Following</p>
            </div>
        </div>

        {(userAge || userProfile.dob || userProfile.gender) && (
            <div className="flex items-center gap-4 mt-6 text-sm text-muted-foreground border p-3 rounded-lg bg-muted/50">
                {userAge && (
                    <div className="flex items-center gap-2">
                        <Cake className="h-4 w-4" />
                        <span>{userAge} years old</span>
                    </div>
                )}
                 {userProfile.dob && userAge && <Separator orientation="vertical" className="h-4" />}
                 {userProfile.dob && (
                    <div className="flex items-center gap-2">
                        <Cake className="h-4 w-4" />
                        <span>{userProfile.dob}</span>
                    </div>
                )}
                {userProfile.gender && (userAge || userProfile.dob) && <Separator orientation="vertical" className="h-4" />}
                {userProfile.gender && (
                     <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4" />
                        <span>{userProfile.gender}</span>
                    </div>
                )}
            </div>
        )}

        <div className="mt-6">
          <EditProfileDialog user={userProfile} />
        </div>
      </div>
      
      <Separator className="my-12" />

      <div className="space-y-12">
        <div>
          <h2 className="text-2xl font-bold font-headline mb-6 text-center md:text-left">
            My Shared Spots
          </h2>
          {isLoadingLocations && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
               {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="aspect-square w-full rounded-lg" />
               ))}
            </div>
          )}
          {!isLoadingLocations && userLocations && userLocations.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {userLocations.map((location) => (
                <Link href={`/locations/${location.id}`} key={location.id}>
                  <Card  className="overflow-hidden group">
                    <CardContent className="p-0">
                      <div className="relative aspect-square">
                        <Image
                          src={location.media.url}
                          alt={location.caption}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 768px) 50vw, 25vw"
                          data-ai-hint={location.media.hint}
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2">
                          <p className="text-white text-xs line-clamp-2">{location.caption}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
             !isLoadingLocations && <p className="text-center text-muted-foreground">You haven't shared any spots yet.</p>
          )}
        </div>

        <Separator />

        <div>
          <h2 className="text-2xl font-bold font-headline mb-6 text-center md:text-left">
            My Bucket List
          </h2>
          {isLoadingSavedLocations && isLoadingSavedEvents ? (
            <div className="text-center py-16 text-muted-foreground">Loading bucket list...</div>
          ) : savedLocations?.length === 0 && savedEvents?.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p>Your bucket list is empty.</p>
              <p>Start exploring and save the places you want to visit!</p>
            </div>
          ) : (
            <div className="space-y-8">
              {savedLocations && savedLocations.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold font-headline">Saved Locations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {savedLocations.map((location) => (
                      <LocationCard key={location.id} location={location} />
                    ))}
                  </div>
                </div>
              )}
              {savedEvents && savedEvents.length > 0 && (
                 <div className="space-y-4">
                   <h3 className="text-xl font-bold font-headline">Saved Events</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-8">
                      {savedEvents.map((event) => (
                        <EventCard key={event.id} event={event} />
                      ))}
                    </div>
                 </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


function ProfilePageSkeleton() {
  return (
    <div className="container mx-auto py-8 animate-pulse">
      <div className="flex flex-col items-center mb-8">
        <Skeleton className="h-32 w-32 rounded-full mb-4" />
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center gap-6 mt-4">
          <div className="text-center">
            <Skeleton className="h-6 w-8 mx-auto mb-1" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="text-center">
            <Skeleton className="h-6 w-8 mx-auto mb-1" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="text-center">
            <Skeleton className="h-6 w-8 mx-auto mb-1" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        <Skeleton className="h-10 w-32 mt-6" />
      </div>

      <Separator className="my-12" />

      <div className="space-y-12">
        <div>
          <Skeleton className="h-7 w-56 mb-6 mx-auto md:mx-0" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-lg" />
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <Skeleton className="h-7 w-48 mb-6 mx-auto md:mx-0" />
          <div className="text-center py-16">
            <Skeleton className="h-4 w-1/2 mx-auto" />
            <Skeleton className="h-4 w-2/3 mx-auto mt-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
