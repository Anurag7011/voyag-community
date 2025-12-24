
'use client';
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reviewSchema, type ReviewSchema } from '@/lib/schemas';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { StarRatingInput } from './StarRatingInput';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { getReviewsCollectionRef } from '@/lib/firestore';
import { useParams } from 'next/navigation';
import { serverTimestamp } from 'firebase/firestore';

export function ReviewForm() {
  const { user } = useUser();
  const firestore = useFirestore();
  const params = React.use(useParams());

  const form = useForm<ReviewSchema>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: '',
    },
  });

  function onSubmit(values: ReviewSchema) {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'You must be logged in to leave a review.',
      });
      return;
    }
    
    const targetId = params.id as string;
    const targetType = params.id.startsWith('loc-') ? 'location' : 'event';

    const reviewData = {
      ...values,
      targetId,
      targetType,
      reviewerId: user.uid,
      reviewerUsername: user.displayName || 'Anonymous',
      createdAt: serverTimestamp(),
    };
    
    const reviewsCollectionRef = getReviewsCollectionRef(firestore);
    addDocumentNonBlocking(reviewsCollectionRef, reviewData);

    toast({
      title: 'Review Submitted!',
      description: 'Thanks for your feedback!',
    });
    form.reset();
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Leave a Review</h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Rating</FormLabel>
                  <FormControl>
                    <StarRatingInput
                      rating={field.value}
                      setRating={rating => field.onChange(rating)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Comment</FormLabel>
                  <FormControl>
                    <Textarea placeholder="What did you think?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={form.formState.isSubmitting || !user}
            >
              {form.formState.isSubmitting
                ? 'Submitting...'
                : 'Submit Review'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
