
'use client';

import Image from 'next/image';
import { type Event } from '@/lib/types';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Bookmark, Share2, Video } from 'lucide-react';
import { StarRating } from '@/components/shared/StarRating';
import Link from 'next/link';
import { useBucketList } from '@/context/BucketListContext';
import { toast } from '@/hooks/use-toast';

type EventCardProps = {
  event: Event;
};

export function EventCard({ event }: EventCardProps) {
  const { isInBucketList, toggleBucketList } = useBucketList();
  const isSaved = isInBucketList(event.id);

  const averageRating = event.reviews.length > 0
    ? event.reviews.reduce((acc, review) => acc + review.rating, 0) / event.reviews.length
    : 0;

  const handleShare = async () => {
    const shareData = {
      title: `Check out this event: ${event.title}`,
      text: event.description,
      url: window.location.origin + `/events/${event.id}`,
    };
    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareData.url);
        toast({
          title: "Link Copied!",
          description: "The link to this event has been copied to your clipboard.",
        });
      } catch (err) {
        console.error('Failed to copy link:', err);
        toast({
          variant: "destructive",
          title: "Copy Failed",
          description: "Could not copy the link to your clipboard.",
        });
      }
    }
  };


  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl">
      <CardContent className="p-0 flex flex-col md:flex-row">
        <div className="relative w-full md:w-2/5 aspect-[16/10] md:aspect-auto bg-muted">
          {event.media.type === 'video' && (
            <div className="absolute top-2 left-2 bg-black/50 text-white p-1 rounded-md z-10">
              <Video className="h-4 w-4" />
            </div>
          )}
          <Image
            src={event.media.type === 'image' ? event.media.url : event.media.thumbnailUrl!}
            alt={event.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 40vw"
            data-ai-hint={event.media.hint}
          />
           <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-background/70 hover:bg-background"
            onClick={() => toggleBucketList(event.id, 'event')}
          >
            <Bookmark className={isSaved ? 'text-primary fill-primary' : 'text-foreground/80'} />
            <span className="sr-only">{isSaved ? 'Remove from bucket list' : 'Add to bucket list'}</span>
          </Button>
        </div>
        <div className="p-6 flex flex-col justify-between w-full md:w-3/5">
          <div>
            <h3 className="text-xl font-bold font-headline mb-2">{event.title}</h3>
            <div className="flex items-center mb-2">
              <StarRating rating={averageRating} totalReviews={event.reviews.length} size={18} />
            </div>
            <div className="space-y-2 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{event.place}</span>
              </div>
            </div>
            <p className="text-sm mb-4 line-clamp-3">
              {event.description}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-auto">
            <Button asChild variant="accent" className="flex-1">
              <Link href={`/events/${event.id}`}>View Details</Link>
            </Button>
            <Button variant="outline" size="icon" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
              <span className="sr-only">Share Event</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
