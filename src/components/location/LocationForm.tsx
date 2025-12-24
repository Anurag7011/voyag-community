
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { locationSchema, type LocationSchema } from '@/lib/schemas';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, WandSparkles, Car, Backpack, Ticket } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../ui/carousel';
import { Separator } from '../ui/separator';

type LocationFormProps = {
  onSubmit: (data: LocationSchema) => void;
};

export function LocationForm({ onSubmit }: LocationFormProps) {
  const [previews, setPreviews] = useState<{url: string, type: 'image' | 'video'}[]>([]);

  const form = useForm<LocationSchema>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      caption: '',
      country: '',
      city: '',
      hashtags: '',
      mapLink: '',
      media: undefined,
      howToReach: '',
      whatToTake: '',
      entryFee: '',
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
    }
  };
  
  const handleFormSubmit = (values: LocationSchema) => {
    onSubmit(values);
    form.reset();
    setPreviews([]);
  }

  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="caption"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Caption</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about this amazing place..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="media"
              render={({ field: { onChange, value, ...rest } }) => (
                <FormItem>
                  <FormLabel>Photos & Videos</FormLabel>
                  <FormControl>
                    <div className="relative flex justify-center items-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
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
                           <Upload className="w-8 h-8"/>
                           <span className="font-semibold">Click to upload</span>
                           <span className="text-sm">Images or Videos (Multiple)</span>
                        </div>
                      )}
                      <Input
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept="image/png, image/jpeg, image/webp, video/mp4, video/webm"
                        multiple
                        onChange={(e) => {
                          onChange(e.target.files);
                          handleMediaChange(e);
                        }}
                        {...rest}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Japan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City or Town</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Kyoto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="mapLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Google Maps Link</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://maps.app.goo.gl/..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <div className="space-y-6">
              <h3 className="text-lg font-medium">Visitor Information</h3>
              <FormField
                control={form.control}
                name="howToReach"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Car className="mr-2 h-4 w-4" /> How to Reach</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Take the metro line 2 to Central Station, then a 10-minute walk..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="whatToTake"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Backpack className="mr-2 h-4 w-4" /> What to Take Along</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Comfortable walking shoes, water bottle, and a camera..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="entryFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Ticket className="mr-2 h-4 w-4" /> Entry Fee</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., $10, Free for children under 12, or 'Free'" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />
            
            <FormField
              control={form.control}
              name="hashtags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hashtags</FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <Input
                        placeholder="e.g., #temple, #serene, #bambooforest"
                        {...field}
                      />
                       <Button variant="ghost" size="sm" type="button" className="absolute right-1 top-1/2 -translate-y-1/2 h-7">
                        <WandSparkles className="h-4 w-4 mr-2" />
                        Generate
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Submitting...' : 'Submit Location'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
