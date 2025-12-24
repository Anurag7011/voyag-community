
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { getLocationsByUserQuery, getUserByUsernameQuery } from '@/lib/firestore';
import { type Location, type User as UserType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { notFound } from 'next/navigation';
import { EditProfileDialog } from '@/components/profile/EditProfileDialog';
import { useFollow } from '@/hooks/useFollow';
import { LoginDialog } from '@/components/auth/LoginDialog';


export default function UserProfilePage({ params }: { params: { username: string } }) {
  const { username } = React.use(params);
  const firestore = useFirestore();
  const { user: currentUser, isUserLoading: isCurrentUserLoading } = useUser();

  const userQuery = useMemoFirebase(() => {
    if (!username || !firestore) return null;
    return getUserByUsernameQuery(firestore, username);
  }, [firestore, username]);
  
  const { data: users, isLoading: isProfileLoading } = useCollection<UserType>(userQuery);
  const userProfile = users?.[0];

  const userLocationsQuery = useMemoFirebase(() => {
    if (!userProfile || !firestore) return null;
    return getLocationsByUserQuery(firestore, userProfile.id);
  }, [firestore, userProfile]);

  const { data: userLocations, isLoading: isLoadingLocations } = useCollection<Location>(userLocationsQuery);
  
  const { isFollowing, toggleFollow, isLoading: isFollowLoading } = useFollow(userProfile?.id);


  const isLoading = isCurrentUserLoading || isProfileLoading;
  
  if (isLoading) {
    return <ProfilePageSkeleton />;
  }

  if (!userProfile) {
    return notFound();
  }

  const isOwnProfile = currentUser?.uid === userProfile?.id;
  const userName = userProfile.name || 'New User';
  const userAvatarUrl = userProfile.avatar.imageUrl || `https://i.pravatar.cc/150?u=${userProfile.id}`;
  const userUsername = userProfile.username ? `@${userProfile.username}` : '';
  
  const renderFollowButton = () => {
    if (isOwnProfile) {
      return <EditProfileDialog user={userProfile} />;
    }
    if (!currentUser) {
        return <LoginDialog triggerText="Follow" variant="default" />;
    }
    return (
      <Button onClick={toggleFollow} disabled={isFollowLoading}>
        {isFollowLoading ? '...' : isFollowing ? 'Unfollow' : 'Follow'}
      </Button>
    );
  };


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

        <div className="mt-6">
          {renderFollowButton()}
        </div>
      </div>
      
      <Separator className="my-12" />

      <div className="space-y-12">
        <div>
          <h2 className="text-2xl font-bold font-headline mb-6 text-center md:text-left">
            {isOwnProfile ? 'My Shared Spots' : `${userName}'s Shared Spots`}
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
             !isLoadingLocations && <p className="text-center text-muted-foreground">{isOwnProfile ? "You haven't shared any spots yet." : `${userName} hasn't shared any spots yet.`}</p>
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
      </div>
    </div>
  );
}
