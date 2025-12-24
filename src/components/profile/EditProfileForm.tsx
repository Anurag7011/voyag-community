'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Upload } from 'lucide-react';
import { type User } from '@/lib/types';
import { useAuth, useFirestore } from '@/firebase';
import { checkUsernameExists } from '@/firebase/non-blocking-login';
import { getUserDocRef, uploadImage } from '@/lib/firestore';
import { deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DialogFooter } from '../ui/dialog';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { profileSchema, type ProfileSchema } from '@/lib/schemas';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { cn } from '@/lib/utils';
import { deleteUser } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"


const travelInterestsList = [
    { id: 'hiking', label: 'Hiking' },
    { id: 'beaches', label: 'Beaches' },
    { id: 'city_tours', label: 'City Tours' },
    { id: 'nightlife', label: 'Nightlife' },
    { id: 'foodie', label: 'Foodie Trails' },
    { id: 'backpacking', label: 'Backpacking' },
    { id: 'luxury', label: 'Luxury Travel' },
    { id: 'adventure_sports', label: 'Adventure Sports' },
    { id: 'cultural_immersion', label: 'Cultural Immersion' },
    { id: 'wellness_spa', label: 'Wellness & Spa' },
    { id: 'wildlife_safari', label: 'Wildlife Safari' },
    { id: 'road_trips', label: 'Road Trips' },
  ];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => currentYear - i - 18);
const months = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: new Date(0, i).toLocaleString('default', { month: 'long' }) }));
const days = Array.from({ length: 31 }, (_, i) => String(i + 1));


type EditProfileFormProps = {
  user: User;
  isSetupMode?: boolean;
  onSaved?: () => void;
};

export function EditProfileForm({ user, isSetupMode = false, onSaved }: EditProfileFormProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();

  const [dobDay, dobMonth, dobYear] = user.dob ? user.dob.split('-') : [undefined, undefined, undefined];


  const form = useForm<ProfileSchema>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user.username || '',
      avatarFile: null,
      dobDay: dobDay,
      dobMonth: dobMonth,
      dobYear: dobYear,
      gender: user.gender,
      travelInterests: user.travelInterests || [],
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      form.setValue('avatarFile', e.target.files);
    }
  };

  const onSubmit = async (values: ProfileSchema) => {
    // Check for username uniqueness if it has changed
    if (values.username !== user.username) {
        const isUsernameTaken = await checkUsernameExists(firestore, values.username);
        if (isUsernameTaken) {
            form.setError('username', {
                type: 'manual',
                message: 'This username is already taken. Please choose another one.',
            });
            return;
        }
    }

    const userDocRef = getUserDocRef(firestore, user.id);
    let avatarData = {};

    if (values.avatarFile && values.avatarFile[0]) {
      try {
        const imageUrl = await uploadImage(values.avatarFile[0]);
        avatarData = { 
          avatar: { 
            imageUrl, 
            imageHint: 'user avatar' 
          } 
        };
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Image Upload Failed',
          description: 'Could not upload your new profile picture. Please try again.',
        });
        return;
      }
    }
    
    const dob = (values.dobYear && values.dobMonth && values.dobDay) 
    ? `${values.dobYear}-${String(values.dobMonth).padStart(2, '0')}-${String(values.dobDay).padStart(2, '0')}`
    : null;

    const updatedData: Record<string, any> = {
      username: values.username,
      travelInterests: values.travelInterests,
      ...avatarData,
    };

    if (dob) updatedData.dob = dob;
    if (values.gender) updatedData.gender = values.gender;
    

    updateDocumentNonBlocking(userDocRef, updatedData);
    toast({
      title: 'Profile Saved!',
      description: `Your profile has been successfully updated.`,
    });
    
    if (onSaved) {
        onSaved();
    }
  };

  const handleDeleteAccount = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== user.id) {
        toast({ variant: "destructive", title: "Error", description: "You can only delete your own account." });
        return;
    }

    try {
        // First, delete the user document from Firestore.
        const userDocRef = getUserDocRef(firestore, user.id);
        deleteDocumentNonBlocking(userDocRef);

        // Then, delete the user from Firebase Authentication.
        await deleteUser(currentUser);
        
        toast({ title: "Account Deleted", description: "Your account has been permanently deleted." });
        router.push('/'); // Navigate to home page after deletion
    } catch (error: any) {
        console.error("Error deleting account:", error);
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: error.code === 'auth/requires-recent-login'
                ? "This is a sensitive operation. Please log out and log back in before deleting your account."
                : error.message || "Could not delete your account. Please try again."
        });
    }
};

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <ScrollArea className={cn(isSetupMode ? "h-[65vh]" : "h-[70vh]", "pr-4")}>
        <div className="space-y-6">
            <FormField
            control={form.control}
            name="avatarFile"
            render={() => (
                <FormItem>
                <FormLabel>Profile Picture</FormLabel>
                <FormControl>
                    <div className='flex justify-center'>
                    <label htmlFor="avatar-upload" className="relative cursor-pointer group">
                        <Avatar className="h-24 w-24">
                        <AvatarImage src={preview || user.avatar.imageUrl} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="h-6 w-6 text-white" />
                        </div>
                    </label>
                    <Input
                        id="avatar-upload"
                        type="file"
                        className="hidden"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleFileChange}
                    />
                    </div>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />

            <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                    <div className="relative">
                    <p className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</p>
                    <Input placeholder="your_unique_username" className="pl-6" {...field} />
                    </div>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            
            <div>
              <FormLabel>Date of Birth</FormLabel>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <FormField
                  control={form.control}
                  name="dobDay"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isSetupMode && !!user.dob}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {days.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="dobMonth"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isSetupMode && !!user.dob}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Month" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {months.map(month => <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dobYear"
                  render={({ field }) => (
                    <FormItem>
                       <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isSetupMode && !!user.dob}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {years.map(year => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Gender</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                      disabled={!isSetupMode && !!user.gender}
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Male" />
                        </FormControl>
                        <FormLabel className="font-normal">Male</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Female" />
                        </FormControl>
                        <FormLabel className="font-normal">Female</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Do not wish to disclose" />
                        </FormControl>
                        <FormLabel className="font-normal">Do not wish to disclose</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <FormField
                control={form.control}
                name="travelInterests"
                render={() => (
                    <FormItem>
                        <div className="mb-4">
                            <FormLabel className="text-base">Travel Interests</FormLabel>
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            {travelInterestsList.map((item) => (
                            <FormField
                                key={item.id}
                                control={form.control}
                                name="travelInterests"
                                render={({ field }) => {
                                return (
                                    <FormItem
                                    key={item.id}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                    <FormControl>
                                        <Checkbox
                                        checked={field.value?.includes(item.id)}
                                        onCheckedChange={(checked) => {
                                            return checked
                                            ? field.onChange([...(field.value || []), item.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                (value) => value !== item.id
                                                )
                                            )
                                        }}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                        {item.label}
                                    </FormLabel>
                                    </FormItem>
                                )
                                }}
                            />
                            ))}
                        </div>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        </ScrollArea>
        
        {isSetupMode ? (
             <Button type="submit" className="w-full mt-6" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Complete Profile Setup'}
             </Button>
        ) : (
            <DialogFooter className="pt-4 sm:justify-between">
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">Delete Account</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your
                            account, posts, and all of your data from our servers.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={handleDeleteAccount}
                        >
                            Yes, delete my account
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Saving...' : 'Save changes'}
                </Button>
            </DialogFooter>
        )}
      </form>
    </Form>
  );
}
