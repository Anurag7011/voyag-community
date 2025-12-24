
'use client';
import Link from 'next/link';
import { EventCard } from '@/components/event/EventCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { getEventsCollectionRef } from '@/lib/firestore';
import { type Event } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function EventsPage() {
  const firestore = useFirestore();
  const eventsQuery = useMemoFirebase(() => getEventsCollectionRef(firestore), [firestore]);
  const { data: events, isLoading } = useCollection<Event>(eventsQuery);

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <div className="mb-4">
          <h1 className="text-3xl font-bold font-headline">Local Events</h1>
          <p className="text-muted-foreground mt-2">
            Find authentic experiences happening around the world.
          </p>
        </div>
        <div className="mt-6">
            <Button asChild>
            <Link href="/events/add">
                <Plus className="mr-2 h-4 w-4" />
                Add Event
            </Link>
            </Button>
        </div>
      </div>

      {isLoading && (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-8">
          {[...Array(4)].map((_, i) => <EventCardSkeleton key={i} />)}
        </div>
      )}

      {!isLoading && events && events.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-8">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {!isLoading && (!events || events.length === 0) && (
         <div className="text-center py-16">
          <p className="text-muted-foreground">No events found.</p>
        </div>
      )}
    </div>
  );
}

function EventCardSkeleton() {
  return (
    <div className="flex flex-col md:flex-row rounded-lg border overflow-hidden">
      <Skeleton className="h-64 w-full md:w-2/5" />
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
        <Skeleton className="h-10 w-32 mt-4" />
      </div>
    </div>
  );
}
