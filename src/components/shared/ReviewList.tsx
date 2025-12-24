import { type Review } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { StarRating } from './StarRating';

type ReviewListProps = {
  reviews: Review[];
};

export function ReviewList({ reviews }: ReviewListProps) {
  if (reviews.length === 0) {
    return <p className="text-sm text-muted-foreground">No reviews yet. Be the first to leave one!</p>;
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div key={review.id} className="flex gap-4">
          <Avatar>
            <AvatarImage src={review.user.avatar.imageUrl} alt={review.user.name} data-ai-hint={review.user.avatar.imageHint} />
            <AvatarFallback>{review.user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{review.user.name}</p>
              <StarRating rating={review.rating} showText={false} size={14} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
