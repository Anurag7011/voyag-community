
'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { eventSchema, type EventSchema } from '@/lib/schemas';
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
import { Upload, Plus, Trash2, Link as LinkIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../ui/carousel';
import { Separator } from '../ui/separator';
import { Checkbox } from '../ui/checkbox';

type EventFormProps = {
  onSubmit: (data: EventSchema) => void;
};

export function EventForm({ onSubmit }: EventFormProps) {
  const [previews, setPreviews] = useState<{url: string, type: 'image' | 'video'}[]>([]);

  const form = useForm<EventSchema>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      date: undefined,
      time: '',
      place: '',
      media: undefined,
      isFree: false,
      tickets: [],
      paymentLink: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "tickets",
  });

  const isFree = form.watch('isFree');

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

  const handleFormSubmit = (values: EventSchema) => {
    const finalValues = {
        ...values,
        tickets: values.isFree ? [] : values.tickets,
        paymentLink: values.isFree ? undefined : values.paymentLink,
      };
    onSubmit(finalValues);
    form.reset();
    setPreviews([]);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Summer Folk Music Fest" {...field} />
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
                    <Textarea
                      placeholder="Tell us about this amazing event..."
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
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date() || date < new Date('1900-01-01')
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="place"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Place / Venue</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Green Meadows Park" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <FormLabel>Ticket Information</FormLabel>
                <FormField
                    control={form.control}
                    name="isFree"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                            <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            />
                        </FormControl>
                        <FormLabel className="font-normal">
                            This is a free event
                        </FormLabel>
                        </FormItem>
                    )}
                />
              </div>

              <div className={cn("space-y-4 rounded-md border p-4", isFree ? "opacity-50 bg-muted/50" : "")}>
                {fields.map((field, index) => (
                    <div key={field.id} className="flex items-end gap-4">
                    <FormField
                        control={form.control}
                        name={`tickets.${index}.name`}
                        render={({ field }) => (
                        <FormItem className="flex-1">
                            <FormLabel className="text-xs">Tier Name</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g., General Admission" {...field} disabled={isFree} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name={`tickets.${index}.price`}
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs">Price ($)</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="e.g., 25" {...field} disabled={isFree} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => remove(index)}
                        disabled={isFree}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    </div>
                ))}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ name: '', price: 0 })}
                    disabled={isFree}
                    className="mt-4"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Ticket Tier
                </Button>
                <FormField
                    control={form.control}
                    name="paymentLink"
                    render={({ field }) => (
                    <FormItem className='pt-4'>
                        <FormLabel className='flex items-center gap-2'><LinkIcon className='w-4 h-4' />Booking / Payment Link</FormLabel>
                        <FormControl>
                        <Input placeholder="https://your-ticket-provider.com/..." {...field} disabled={isFree} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
            </div>
            
            <Separator />

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Submitting...' : 'Submit Event'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
