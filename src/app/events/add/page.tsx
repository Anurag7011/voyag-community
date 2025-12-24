
'use client';
import { EventForm } from "@/components/event/EventForm";
import { useFirestore, useUser } from "@/firebase";
import { addDoc, serverTimestamp } from 'firebase/firestore';
import { getEventsCollectionRef, uploadMedia } from "@/lib/firestore";
import { type EventSchema } from "@/lib/schemas";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn } from "lucide-react";

export default function AddEventPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  const handleAddEvent = async (data: EventSchema) => {
     if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "You must be logged in to add an event.",
      });
      return;
    }

    if (!data.media || data.media.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Media Required',
        description: 'Please upload an image or video for the event.',
      });
      return;
    }
    
    try {
      // 1. Upload the media and get the Media object with the URL
      const uploadedMedia = await uploadMedia(data.media[0]);

      // 2. Construct the new event object
      const newEvent: any = {
        title: data.title,
        description: data.description,
        date: format(data.date, 'MMMM d, yyyy'),
        time: data.time,
        place: data.place,
        media: uploadedMedia,
        reviews: [],
        likes: 0,
        isFree: data.isFree,
        tickets: data.isFree ? [] : data.tickets,
        user: {
          id: user.uid,
          name: user.displayName || 'Anonymous User',
          avatar: {
            imageUrl: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
            imageHint: 'user avatar'
          }
        },
        createdAt: serverTimestamp(),
      };

      // Conditionally add paymentLink to avoid 'undefined' values
      if (!data.isFree && data.paymentLink) {
        newEvent.paymentLink = data.paymentLink;
      }


      const collectionRef = getEventsCollectionRef(firestore);
      const docRef = await addDoc(collectionRef, newEvent);

      toast({
        title: "Event Submitted!",
        description: "Thanks for sharing your event with the community.",
      });
      
      router.push(`/events/${docRef.id}`);

    } catch (error) {
      console.error("Error adding event:", error);
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: (error as Error).message || "Could not submit your event. Please try again.",
      });
    }
  };

  if (isUserLoading) {
    return (
       <div className="container mx-auto max-w-2xl py-8">
         <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-headline">Host a New Event</h1>
          <p className="text-muted-foreground mt-2">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
       <div className="container mx-auto max-w-2xl py-12 text-center">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Join the Community!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <p className="text-muted-foreground">
                You need to be logged in to host a new event.
              </p>
              <Button asChild>
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  Login or Sign Up
                </Link>
              </Button>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold font-headline">Host a New Event</h1>
        <p className="text-muted-foreground mt-2">
          Share your local event with the VOYAĠ community.
        </p>
      </div>
      <EventForm onSubmit={handleAddEvent} />
    </div>
  );
}
