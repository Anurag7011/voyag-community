'use client';

import { type Location } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Card, CardContent } from '../ui/card';
import { MapPin, MessageSquare, Star } from 'lucide-react';
import Link from 'next/link';

type Props = {
  location: Location;
};

export function LocationSearchResultCard({ location }: Props) {
  const averageRating =
    location.reviews.length > 0
      ? location.reviews.reduce((acc, review) => acc + review.rating, 0) / location.reviews.length
      : 0;

  return (
    <Link href={`/locations/${location.id}`}>
      <Card className="hover:bg-muted/50 transition-colors">
        <CardContent className="p-4 flex gap-4 items-start">
          <Avatar className="h-20 w-20 rounded-md">
            <AvatarImage src={location.media.url} alt={location.caption} />
            <AvatarFallback>{location.city.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-lg">{`${location.city}, ${location.country}`}</p>
            <p className="text-sm text-muted-foreground line-clamp-2">{location.caption}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                <div className="flex items-center gap-1">
                    <Avatar className='h-4 w-4'>
                        <AvatarImage src={location.user.avatar.imageUrl} alt={location.user.name} />
                        <AvatarFallback>{location.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs">{location.user.name}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    <span className="text-xs">{averageRating.toFixed(1)} ({location.reviews.length})</span>
                </div>
                 <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-xs">{location.likes || 0}</span>
                </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
