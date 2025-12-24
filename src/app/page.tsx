
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type Location, type Event, type User as UserType } from '@/lib/types';
import {
  useCollection,
  useDoc,
  useFirestore,
  useMemoFirebase,
  useUser,
} from '@/firebase';
import {
  getEventsCollectionRef,
  getLocationsByUserQuery,
  getLocationsCollectionRef,
  getUserDocRef,
} from '@/lib/firestore';
import { PostCard } from '@/components/shared/PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { LogIn } from 'lucide-react';
import Image from 'next/image';

export default function HomePage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  // --- Data Fetching ---
  const userRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return getUserDocRef(firestore, user.uid);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserType>(userRef);


  const locationsQuery = useMemoFirebase(
    () => {
        if (!firestore) return null;
        return getLocationsCollectionRef(firestore);
    },
    [firestore]
  );
  const { data: allLocations, isLoading: isLoadingLocations } =
    useCollection<Location>(locationsQuery);

  const eventsQuery = useMemoFirebase(
    () => {
        if (!firestore) return null;
        return getEventsCollectionRef(firestore);
    },
    [firestore]
  );
  const { data: allEvents, isLoading: isLoadingEvents } =
    useCollection<Event>(eventsQuery);

  const userPostsQuery = useMemoFirebase(() => {
    // Wait for auth to be ready and user to exist
    if (isUserLoading || !user || !firestore) return null;
    return getLocationsByUserQuery(firestore, user.uid);
  }, [firestore, user, isUserLoading]);
  const { data: userPosts, isLoading: isLoadingUserPosts } =
    useCollection<Location>(userPostsQuery);

  // --- Memoized Data Processing ---
  const curatedPosts = useMemo(() => {
    // CRITICAL FIX: Do not process data until it is fully loaded.
    if (isLoadingLocations || isLoadingEvents || !allLocations || !allEvents) {
      return [];
    }

    const combined = [
      ...allLocations.map((item) => ({ ...item, type: 'location' as const })),
      ...allEvents.map((item) => ({ ...item, type: 'event' as const })),
    ];

    const userInterests = userProfile?.travelInterests;

    // If user is logged in and has interests, personalize the feed
    if (userInterests && userInterests.length > 0) {
        return combined.sort((a, b) => {
            let scoreA = 0;
            let scoreB = 0;

            if (a.type === 'location') {
                scoreA = a.hashtags.filter(tag => userInterests.includes(tag.replace('#', ''))).length;
            } else if (a.type === 'event') {
                scoreA = userInterests.filter(interest => a.title.toLowerCase().includes(interest) || a.description.toLowerCase().includes(interest)).length;
            }

            if (b.type === 'location') {
                scoreB = b.hashtags.filter(tag => userInterests.includes(tag.replace('#', ''))).length;
            } else if (b.type === 'event') {
                scoreB = userInterests.filter(interest => b.title.toLowerCase().includes(interest) || b.description.toLowerCase().includes(interest)).length;
            }
            
            // Add popularity as a secondary sorting factor
            scoreA += (a.likes ?? 0) * 0.1 + (a.reviews?.length ?? 0) * 0.2;
            scoreB += (b.likes ?? 0) * 0.1 + (b.reviews?.length ?? 0) * 0.2;

            return scoreB - scoreA;
        });
    }

    // Default sorting by popularity for guests or users without interests
    return combined.sort((a, b) => {
      const scoreA = (a.likes ?? 0) + (a.reviews?.length ?? 0);
      const scoreB = (b.likes ?? 0) + (b.reviews?.length ?? 0);
      return scoreB - scoreA;
    });
  }, [allLocations, allEvents, userProfile, isLoadingLocations, isLoadingEvents]);

  const isLoading = isLoadingLocations || isLoadingEvents || isUserLoading;

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1
          className="text-5xl md:text-7xl font-bold font-headline tracking-widest text-primary"
          style={{ fontFamily: "'VT323', monospace" }}
        >
          VOYAĠ
        </h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground">
          A Community by Travellers, for Travellers
        </p>
      </div>

      <div className="border-b">
        <Tabs defaultValue="curated" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto rounded-none bg-transparent p-0 h-auto">
            <TabsTrigger
              value="curated"
              className="rounded-none border-b-2 border-transparent py-3 data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:shadow-none"
            >
              Curated Picks
            </TabsTrigger>
            <TabsTrigger
              value="dashboard"
              className="rounded-none border-b-2 border-transparent py-3 data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:shadow-none"
            >
              Dashboard
            </TabsTrigger>
          </TabsList>
          
          {/* Curated Picks Tab */}
          <TabsContent value="curated" className="mt-8">
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => <PostCardSkeleton key={i} />)}
              </div>
            )}
            {!isLoading && curatedPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {curatedPosts.map((post) => (
                  <PostCard key={`${post.type}-${post.id}`} post={post} />
                ))}
              </div>
            ) : (
              !isLoading && <p className="text-center text-muted-foreground py-16">No posts found.</p>
            )}
          </TabsContent>
          
          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-8">
            {isUserLoading || isProfileLoading ? (
              <div className="space-y-8">
                <DashboardSkeleton />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="aspect-square w-full rounded-lg" />
                  ))}
                </div>
              </div>
            ) : user && userProfile ? (
              <div className="space-y-8">
                <div className="flex justify-center">
                    <div className="flex items-center gap-6 text-center">
                        <div>
                            <p className="font-bold text-2xl">{userPosts?.length || 0}</p>
                            <p className="text-sm text-muted-foreground">Posts</p>
                        </div>
                        <div>
                            <p className="font-bold text-2xl">{userProfile.followers || 0}</p>
                            <p className="text-sm text-muted-foreground">Followers</p>
                        </div>
                        <div>
                            <p className="font-bold text-2xl">{userProfile.following || 0}</p>
                            <p className="text-sm text-muted-foreground">Following</p>
                        </div>
                    </div>
                </div>

                {isLoadingUserPosts ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                          <Skeleton key={i} className="aspect-square w-full rounded-lg" />
                        ))}
                    </div>
                ) : userPosts && userPosts.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {userPosts.map((post) => (
                       <Link href={`/locations/${post.id}`} key={post.id}>
                        <Card  className="overflow-hidden group">
                          <CardContent className="p-0">
                            <div className="relative aspect-square">
                              <Image
                                src={post.media.url}
                                alt={post.caption}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                sizes="(max-width: 768px) 50vw, 25vw"
                                data-ai-hint={post.media.hint}
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2">
                                <p className="text-white text-xs line-clamp-2">{post.caption}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground">You haven't shared any spots yet.</p>
                    <Button asChild className="mt-4">
                      <Link href="/add">Share Your First Spot</Link>
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16">
                <Card className="max-w-md mx-auto">
                  <CardHeader>
                    <CardTitle>View Your Dashboard</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      Log in to see your posts and stats.
                    </p>
                    <Button asChild>
                      <Link href="/login"><LogIn className="mr-2"/> Login</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function PostCardSkeleton() {
    return (
      <div className="flex flex-col space-y-3">
        <Skeleton className="h-[225px] w-full rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );
  }

function DashboardSkeleton() {
  return(
    <div className="flex justify-center">
        <div className="flex items-center gap-6 text-center">
            <div>
                <Skeleton className="h-8 w-10 mx-auto mb-1" />
                <Skeleton className="h-4 w-12" />
            </div>
            <div>
                <Skeleton className="h-8 w-10 mx-auto mb-1" />
                <Skeleton className="h-4 w-16" />
            </div>
            <div>
                <Skeleton className="h-8 w-10 mx-auto mb-1" />
                <Skeleton className="h-4 w-16" />
            </div>
        </div>
    </div>
  )
}
