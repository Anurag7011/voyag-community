'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { groupSchema, type GroupSchema } from '@/lib/schemas';
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
import { Upload, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { addCountryGroup, uploadImage } from '@/lib/firestore';
import { useFirestore } from '@/firebase';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';

type GroupFormProps = {
  onSubmitted: () => void;
};

export function GroupForm({ onSubmitted }: GroupFormProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const firestore = useFirestore();

  const form = useForm<GroupSchema>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      country: '',
      id: '',
      flag: '',
      image: undefined,
      groups: [{ city: '', whatsappLink: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'groups',
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      form.setValue('image', e.target.files);
    }
  };

  const onSubmit = async (values: GroupSchema) => {
    if (!values.image || values.image.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Image Required',
        description: 'Please upload an image for the country.',
      });
      return;
    }

    try {
      const imageFile = values.image[0];
      const imageUrl = await uploadImage(imageFile);

      const newGroupData = {
        ...values,
        image: {
          imageUrl,
          imageHint: `image of ${values.country}`,
        },
      };
      
      await addCountryGroup(firestore, values.id, newGroupData);

      toast({
        title: 'Country Group Added',
        description: `${values.country} has been added.`,
      });
      form.reset();
      setPreview(null);
      onSubmitted();
    } catch (error) {
      console.error('Error adding group:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'Could not add the country group. Please try again.',
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
            name="image"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Country Image</FormLabel>
                <FormControl>
                <div className="relative flex justify-center items-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    {preview ? (
                    <Image
                        src={preview}
                        alt="Country preview"
                        fill
                        className="object-cover rounded-lg"
                    />
                    ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Upload className="w-8 h-8" />
                        <span className="font-semibold">Click to upload</span>
                    </div>
                    )}
                    <Input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleImageChange}
                    />
                </div>
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
        <div className='grid grid-cols-3 gap-4'>
            <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
                <FormItem className='col-span-2'>
                <FormLabel>Country Name</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., United Kingdom" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
            control={form.control}
            name="flag"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Flag</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., 🇬🇧" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <FormField
            control={form.control}
            name="id"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Country ID (Slug)</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., united-kingdom" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        
        <Separator />
        
        <div>
            <FormLabel>City Groups</FormLabel>
            <div className='space-y-4 mt-2'>
            {fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-2 p-3 border rounded-lg">
                    <div className='flex-1 space-y-2'>
                        <FormField
                            control={form.control}
                            name={`groups.${index}.city`}
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs">City Name</FormLabel>
                                <FormControl>
                                <Input placeholder="e.g., London" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`groups.${index}.whatsappLink`}
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs">WhatsApp Link</FormLabel>
                                <FormControl>
                                <Input placeholder="https://chat.whatsapp.com/..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => remove(index)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
              ))}
               <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ city: '', whatsappLink: '' })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add City Group
              </Button>
            </div>
        </div>
        </div>
        </ScrollArea>
        <Button type="submit" className="w-full mt-6" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Adding...' : 'Add Country Group'}
        </Button>
      </form>
    </Form>
  );
}
