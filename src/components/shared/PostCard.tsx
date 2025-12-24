
'use client';
import { type Location, type Event } from '@/lib/types';
import { LocationCard } from '../location/LocationCard';
import { EventCard } from '../event/EventCard';

type Post = (Location & { type: 'location' }) | (Event & { type: 'event' });

type PostCardProps = {
  post: Post;
};

export function PostCard({ post }: PostCardProps) {
  if (post.type === 'location') {
    return <LocationCard location={post} />;
  }
  if (post.type === 'event') {
    // The EventCard is styled differently, so we'll wrap it for consistency
    // or ideally, refactor EventCard to be more flexible.
    // For now, let's just render it.
    if (!post.user) {
        // If an event doesn't have a user, don't render it in the feed.
        return null;
    }
    return <EventCard event={post} />;
  }
  return null;
}
