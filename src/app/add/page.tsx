'use client';
import { LocationForm } from "@/components/location/LocationForm";
import { useFirestore, useUser } from "@/firebase";
import { addDoc, serverTimestamp } from 'firebase/firestore';
import { getLocationsCollectionRef, uploadMedia } from "@/lib/firestore";
import { type LocationSchema } from "@/lib/schemas";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn } from "lucide-react";


export default function AddLocationPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const handleAddLocation = async (data: LocationSchema) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "You must be logged in to add a location.",
      });
      return;
    }
    
    if (!data.media || data.media.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Media Required',
        description: 'Please upload at least one image or video for the location.',
      });
      return;
    }

    try {
      // 1. Upload the media and get the Media object with the URL
      const uploadedMedia = await uploadMedia(data.media[0]);

      // 2. Construct the new location object *without* spreading the raw form data.
      // This prevents the non-serializable FileList from being included.
      const newLocation = {
        caption: data.caption,
        country: data.country,
        city: data.city,
        mapLink: data.mapLink,
        hashtags: data.hashtags ? data.hashtags.split(',').map(h => h.trim()) : [],
        howToReach: data.howToReach,
        whatToTake: data.whatToTake,
        entryFee: data.entryFee,
        media: uploadedMedia, // Use the object returned from the upload
        user: {
          id: user.uid,
          name: user.displayName || 'Anonymous User',
          avatar: {
            imageUrl: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
            imageHint: 'user avatar'
          }
        },
        reviews: [],
        likes: 0,
        createdAt: serverTimestamp(),
      };
      
      const collectionRef = getLocationsCollectionRef(firestore);
      const docRef = await addDoc(collectionRef, newLocation);

      toast({
        title: "Location Submitted!",
        description: "Thanks for sharing a new spot with the community.",
      });

      router.push(`/locations/${docRef.id}`);

    } catch (error) {
      console.error("Error adding location:", error);
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: (error as Error).message || "Could not submit your location. Please try again.",
      });
    }
  };

  if (isUserLoading) {
    return (
      <div className="container mx-auto max-w-2xl py-8">
         <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-headline">Share a New Spot</h1>
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
                You need to be logged in to share a new spot.
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
        <h1 className="text-3xl font-bold font-headline">Share a New Spot</h1>
        <p className="text-muted-foreground mt-2">
          Found somewhere special? Add it to VOYAĠ for others to discover.
        </p>
      </div>
      <LocationForm onSubmit={handleAddLocation} />
    </div>
  );
}
