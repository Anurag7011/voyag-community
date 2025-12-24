
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { type Location } from '@/lib/types';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Share2, MessageSquare, Bookmark, Heart, Video } from 'lucide-react';
import { StarRating } from '../shared/StarRating';
import { useBucketList } from '@/context/BucketListContext';
import { toast } from '@/hooks/use-toast';

type LocationCardProps = {
  location: Location;
};

export function LocationCard({ location }: LocationCardProps) {
  const { isInBucketList, toggleBucketList } = useBucketList();
  const isSaved = isInBucketList(location.id);

  const averageRating =
    location.reviews.length > 0
      ? location.reviews.reduce((acc, review) => acc + review.rating, 0) / location.reviews.length
      : 0;
      
  const handleShare = async () => {
    const shareData = {
      title: `Check out this spot: ${location.city}, ${location.country}`,
      text: location.caption,
      url: window.location.origin + `/locations/${location.id}`,
    };
    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that do not support the Web Share API
      try {
        await navigator.clipboard.writeText(shareData.url);
        toast({
          title: "Link Copied!",
          description: "The link to this location has been copied to your clipboard.",
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
    <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <CardHeader className="flex flex-row items-center gap-3 p-4">
        <Avatar className="h-9 w-9">
          <AvatarImage
            src={location.user.avatar.imageUrl}
            alt={location.user.name}
            width={36}
            height={36}
            data-ai-hint={location.user.avatar.imageHint}
          />
          <AvatarFallback>{location.user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <p className="font-semibold text-sm">{location.user.name}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{`${location.city}, ${location.country}`}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <div className="relative aspect-[4/3] bg-muted">
           {location.media.type === 'video' && (
            <div className="absolute top-2 left-2 bg-black/50 text-white p-1 rounded-md z-10">
              <Video className="h-4 w-4" />
            </div>
          )}
          <Image
            src={location.media.type === 'image' ? location.media.url : location.media.thumbnailUrl!}
            alt={location.caption}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            data-ai-hint={location.media.hint}
          />
           <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-background/70 hover:bg-background"
            onClick={() => toggleBucketList(location.id, 'location')}
          >
            <Bookmark className={isSaved ? 'text-primary fill-primary' : 'text-foreground/80'} />
            <span className="sr-only">{isSaved ? 'Remove from bucket list' : 'Add to bucket list'}</span>
          </Button>
        </div>
        <div className="p-4 space-y-2">
            <div className="flex justify-between items-center">
              <StarRating rating={averageRating} totalReviews={location.reviews.length} />
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Heart className="h-4 w-4" />
                <span>{location.likes ?? 0}</span>
              </div>
            </div>
          <p className="text-sm mt-2">{location.caption}</p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4 p-4 pt-0">
        <div className="flex flex-wrap gap-2">
          {location.hashtags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="w-full grid grid-cols-2 gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/locations/${location.id}`}>
              <MessageSquare className="mr-2 h-4 w-4" />
              View Post
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
