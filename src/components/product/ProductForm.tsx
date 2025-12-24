'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { productSchema, type ProductSchema } from '@/lib/schemas';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { addProduct, uploadMedia } from '@/lib/firestore';
import { useFirestore } from '@/firebase';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../ui/carousel';

type ProductFormProps = {
  onSubmitted: () => void;
};

export function ProductForm({ onSubmitted }: ProductFormProps) {
  const [previews, setPreviews] = useState<{url: string, type: 'image' | 'video'}[]>([]);
  const firestore = useFirestore();

  const form = useForm<ProductSchema>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      brand: '',
      price: 0,
      category: '',
      media: undefined,
    },
  });

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPreviews: {url: string, type: 'image' | 'video'}[] = [];
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push({
            url: reader.result as string,
            type: file.type.startsWith('video') ? 'video' : 'image',
          });
          if (newPreviews.length === files.length) {
            setPreviews(newPreviews);
          }
        };
        reader.readAsDataURL(file);
      });
      form.setValue('media', e.target.files);
    }
  };

  const onSubmit = async (values: ProductSchema) => {
    if (!values.media || values.media.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Media Required',
        description: 'Please upload at least one image or video for the product.',
      });
      return;
    }

    try {
      const mediaFiles = Array.from(values.media);
      const mediaItems = await Promise.all(
        mediaFiles.map(file => uploadMedia(file))
      );

      const newProduct = {
        ...values,
        media: mediaItems,
        rating: 0, // Initialize rating
      };
      
      await addProduct(firestore, newProduct);

      toast({
        title: 'Product Added',
        description: `${values.name} has been added to the store.`,
      });
      form.reset();
      setPreviews([]);
      onSubmitted();
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'Could not add the product. Please try again.',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="media"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Media</FormLabel>
                  <FormControl>
                    <div className="relative flex justify-center items-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      {previews.length > 0 ? (
                        <Carousel className="w-full max-w-xs">
                          <CarouselContent>
                            {previews.map((preview, index) => (
                              <CarouselItem key={index}>
                                <div className="p-1">
                                  <div className="relative aspect-square w-full h-full">
                                     {preview.type === 'image' ? (
                                      <Image
                                        src={preview.url}
                                        alt={`Media preview ${index + 1}`}
                                        fill
                                        className="object-contain rounded-lg"
                                      />
                                    ) : (
                                      <video
                                        src={preview.url}
                                        controls
                                        className="object-contain rounded-lg w-full h-full"
                                      />
                                    )}
                                  </div>
                                </div>
                              </CarouselItem>
                            ))}
                          </CarouselContent>
                          <CarouselPrevious />
                          <CarouselNext />
                        </Carousel>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Upload className="w-8 h-8" />
                          <span className="font-semibold">Click to upload</span>
                          <span className="text-sm">Images or Videos (Multiple)</span>
                        </div>
                      )}
                      <Input
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept="image/png, image/jpeg, image/webp, video/mp4, video/webm"
                        multiple
                        onChange={handleMediaChange}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Waterproof Backpack" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the product..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., AquaShield" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 89.99" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Bags" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </ScrollArea>
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Adding...' : 'Add Product'}
        </Button>
      </form>
    </Form>
  );
}
