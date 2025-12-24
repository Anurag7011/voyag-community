
'use client';
import React from 'react';
import Image from 'next/image';
import { notFound, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, MapPin, Car, Backpack, Ticket, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { StarRating } from '@/components/shared/StarRating';
import { ReviewForm } from '@/components/shared/ReviewForm';
import { ReviewList } from '@/components/shared/ReviewList';
import { Separator } from '@/components/ui/separator';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { getLocationDocRef } from '@/lib/firestore';
import { type Location } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"
import { toast } from '@/hooks/use-toast';

export default function LocationDetailPage({ params }: { params: { id: string } }) {
  const { id } = React.use(params);
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const router = useRouter();
  const locationRef = useMemoFirebase(() => getLocationDocRef(firestore, id), [firestore, id]);
  const { data: location, isLoading } = useDoc<Location>(locationRef);

  if (isLoading) {
    return <LocationDetailSkeleton />;
  }

  if (!location) {
    notFound();
  }
  
  const isOwner = currentUser && location.user && currentUser.uid === location.user.id;

  const averageRating =
    location.reviews.length > 0
      ? location.reviews.reduce((acc, review) => acc + review.rating, 0) / location.reviews.length
      : 0;

  const handleDelete = () => {
    deleteDocumentNonBlocking(locationRef);
    toast({
        title: "Location Deleted",
        description: "Your location post has been successfully removed.",
    });
    router.push('/locations');
  };


  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Left Column: Media & Visitor Info */}
        <div className="space-y-8">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative aspect-[4/3]">
                {location.media.type === 'image' ? (
                  <Image
                    src={location.media.url}
                    alt={location.caption}
                    fill
                    className="object-cover"
                    data-ai-hint={location.media.hint}
                  />
                ) : (
                  <video
                    src={location.media.url}
                    controls
                    className="w-full h-full object-cover"
                    poster={location.media.thumbnailUrl}
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            </CardContent>
          </Card>
          
          {(location.howToReach || location.whatToTake || location.entryFee) && (
            <Card>
              <CardHeader>
                <CardTitle>Visitor Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {location.howToReach && (
                  <div className="flex gap-4">
                    <Car className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold">How to Reach</h4>
                      <p className="text-muted-foreground">{location.howToReach}</p>
                    </div>
                  </div>
                )}
                {location.whatToTake && (
                  <div className="flex gap-4">
                    <Backpack className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold">What to Take</h4>
                      <p className="text-muted-foreground">{location.whatToTake}</p>
                    </div>
                  </div>
                )}
                {location.entryFee && (
                  <div className="flex gap-4">
                    <Ticket className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold">Entry Fee</h4>
                      <p className="text-muted-foreground">{location.entryFee}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Details & Reviews */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={location.user.avatar.imageUrl}
                  alt={location.user.name}
                  data-ai-hint={location.user.avatar.imageHint}
                />
                <AvatarFallback>{location.user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{location.user.name}</p>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{`${location.city}, ${location.country}`}</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-muted-foreground">{location.caption}</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {location.hashtags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>

            <StarRating rating={averageRating} totalReviews={location.reviews.length} size={20} />
            
            <div className="flex items-center gap-2">
                <Button asChild variant="outline" className="flex-1">
                <Link href={location.mapLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View on Google Maps
                </Link>
                </Button>
                {isOwner && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your
                                location post and remove its data from our servers.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete}>Delete Post</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-6">
            <h2 className="text-2xl font-bold font-headline">Reviews</h2>
            <ReviewList reviews={location.reviews} />
            <ReviewForm />
          </div>
        </div>
      </div>
    </div>
  );
}


function LocationDetailSkeleton() {
  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 animate-pulse">
        {/* Left Column */}
        <div className="space-y-8">
          <Skeleton className="h-[300px] w-full rounded-lg" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-full" />
            </CardContent>
          </Card>
        </div>
        {/* Right Column */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-10 w-full rounded-md" />
          <Separator />
          <div className="space-y-6">
            <Skeleton className="h-6 w-1/3" />
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
