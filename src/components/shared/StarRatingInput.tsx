'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingInputProps {
  rating: number;
  setRating: (rating: number) => void;
  totalStars?: number;
  size?: number;
  className?: string;
}

export function StarRatingInput({
  rating,
  setRating,
  totalStars = 5,
  size = 24,
  className,
}: StarRatingInputProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const handleSetRating = (newRating: number) => {
    // Allows unsetting the rating by clicking the same star again
    if (rating === newRating) {
      setRating(0);
    } else {
      setRating(newRating);
    }
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[...Array(totalStars)].map((_, i) => {
        const starValue = i + 1;
        return (
          <button
            type="button"
            key={i}
            onMouseEnter={() => setHoverRating(starValue)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => handleSetRating(starValue)}
            className="cursor-pointer"
            aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
          >
            <Star
              size={size}
              className={cn(
                'transition-colors',
                starValue <= (hoverRating || rating)
                  ? 'text-primary'
                  : 'text-muted-foreground/40'
              )}
              fill="currentColor"
            />
          </button>
        );
      })}
    </div>
  );
}
