'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  totalStars?: number;
  size?: number;
  className?: string;
  showText?: boolean;
  totalReviews?: number;
}

export function StarRating({
  rating,
  totalStars = 5,
  size = 16,
  className,
  showText = true,
  totalReviews = 0,
}: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const partialStarPercentage = (rating - fullStars) * 100;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center">
        {[...Array(totalStars)].map((_, i) => {
          const starNumber = i + 1;
          const isFull = starNumber <= fullStars;
          const isPartial = starNumber === fullStars + 1;

          return (
            <div key={i} className="relative">
              <Star
                className={cn('text-muted-foreground/40')}
                fill="currentColor"
                size={size}
              />
              {(isFull || isPartial) && (
                <div
                  className="absolute top-0 left-0 h-full overflow-hidden"
                  style={{ width: isFull ? '100%' : `${partialStarPercentage}%` }}
                >
                  <Star
                    className={cn('text-primary')}
                    fill="currentColor"
                    size={size}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {showText && (
        <span className="text-xs text-muted-foreground">
          {rating.toFixed(1)} ({totalReviews} reviews)
        </span>
      )}
    </div>
  );
}
