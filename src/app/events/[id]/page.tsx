
'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, MapPin, Ticket, Trash2, ExternalLink } from 'lucide-react';
import { StarRating } from '@/components/shared/StarRating';
import { ReviewForm } from '@/components/shared/ReviewForm';
import { ReviewList } from '@/components/shared/ReviewList';
import { Separator } from '@/components/ui/separator';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { getEventDocRef } from '@/lib/firestore';
import { type Event } from '@/lib/types';
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
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const { id } = React.use(params);
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const router = useRouter();
  const eventRef = useMemoFirebase(() => getEventDocRef(firestore, id), [firestore, id]);
  const { data: event, isLoading } = useDoc<Event>(eventRef);


  if (isLoading) {
    return <EventDetailSkeleton />;
  }

  if (!event) {
    notFound();
  }

  const averageRating =
    event.reviews.length > 0
      ? event.reviews.reduce((acc, review) => acc + review.rating, 0) / event.reviews.length
      : 0;
  
  const isOwner = currentUser && event.user && currentUser.uid === event.user.id;

  const handleDelete = () => {
    deleteDocumentNonBlocking(eventRef);
    toast({
        title: "Event Deleted",
        description: "Your event has been successfully removed.",
    });
    router.push('/events');
  };

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Left Column: Media */}
        <div>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative aspect-[4/3]">
                {event.media.type === 'image' ? (
                  <Image
                    src={event.media.url}
                    alt={event.title}
                    fill
                    className="object-cover"
                    data-ai-hint={event.media.hint}
                  />
                ) : (
                  <video
                    src={event.media.url}
                    controls
                    className="w-full h-full object-cover"
                    poster={event.media.thumbnailUrl}
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Details */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold font-headline">{event.title}</h1>
                    {event.isFree && <Badge className="mt-2">Free Event</Badge>}
                </div>
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
                                event and remove its data from our servers.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete}>Delete Event</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
            
            <StarRating rating={averageRating} totalReviews={event.reviews.length} size={20} />

            <div className="space-y-3 text-muted-foreground">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="font-medium">{event.date}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <span className="font-medium">{event.time}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-medium">{event.place}</span>
              </div>
            </div>

            <div>
              <p className="text-foreground">{event.description}</p>
            </div>
            
            {event.paymentLink && (
              <Button asChild>
                <Link href={event.paymentLink} target="_blank" rel="noopener noreferrer">
                  <Ticket className="mr-2 h-4 w-4" />
                  Book Tickets
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}

            {!event.isFree && event.tickets && event.tickets.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h2 className="text-xl font-bold font-headline flex items-center">
                    <Ticket className="mr-3 h-5 w-5 text-primary" />
                    Tickets
                  </h2>
                  <div className="space-y-2">
                    {event.tickets.map((ticket, index) => (
                      <div key={index} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded-md">
                        <span className="font-medium text-foreground">{ticket.name}</span>
                        <span className="font-semibold text-primary">
                          {ticket.price > 0 ? `$${ticket.price.toFixed(2)}` : 'Free'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          
          <Separator />
          
          {/* Reviews Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold font-headline">Reviews</h2>
            <ReviewList reviews={event.reviews} />
            <ReviewForm />
          </div>
        </div>
      </div>
    </div>
  );
}

function EventDetailSkeleton() {
  return (
    <div className="container mx-auto max-w-4xl py-8 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Left Column */}
        <div>
          <Skeleton className="h-[350px] w-full rounded-lg" />
        </div>
        {/* Right Column */}
        <div className="space-y-6">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <div className="space-y-3">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <Separator />
          <div className="space-y-3">
            <Skeleton className="h-6 w-1/4" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-full rounded-md" />
              <Skeleton className="h-8 w-full rounded-md" />
            </div>
          </div>
          <Separator />
          <div className="space-y-4">
             <Skeleton className="h-6 w-1/3" />
             <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-full" />
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
