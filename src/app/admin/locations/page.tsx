
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { getLocationsCollectionRef, getDeletionRequestsCollectionRef } from '@/lib/firestore';
import { type Location } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"
import { toast } from '@/hooks/use-toast';
import { AdminNav } from '@/components/admin/AdminNav';
import { useAdmin } from '@/hooks/useAdmin';
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { serverTimestamp } from 'firebase/firestore';
  

export default function AdminLocationsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { isOwner } = useAdmin();

  const [reason, setReason] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);


  const locationsQuery = useMemoFirebase(() => getLocationsCollectionRef(firestore), [firestore]);
  const { data: locations, isLoading } = useCollection<Location>(locationsQuery);

  const handleRequestDeletion = () => {
    if (!selectedLocation || !user || !reason) {
        toast({variant: "destructive", title: "Missing Information", description: "A reason is required to request deletion."})
        return;
    };
    
    const requestsCollectionRef = getDeletionRequestsCollectionRef(firestore);
    addDocumentNonBlocking(requestsCollectionRef, {
        targetId: selectedLocation.id,
        targetType: 'location',
        targetContent: selectedLocation,
        requesterId: user.uid,
        requesterName: user.displayName || 'Admin',
        reason: reason,
        status: 'pending',
        createdAt: serverTimestamp(),
    });
    
    toast({
        title: "Deletion Requested",
        description: "The owner has been notified to review your request.",
    });

    setIsRequestDialogOpen(false);
    setSelectedLocation(null);
    setReason('');
  };

  const openRequestDialog = (location: Location) => {
    setSelectedLocation(location);
    setIsRequestDialogOpen(true);
  }

  return (
    <>
    <AdminNav />
    <Card>
      <CardHeader>
        <CardTitle>Manage Locations</CardTitle>
        <CardDescription>
          Review and moderate all user-submitted locations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Loading locations...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && locations && locations.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={4} className="text-center">
                        No locations found.
                    </TableCell>
                </TableRow>
            )}
            {locations?.map((location) => (
              <TableRow key={location.id}>
                <TableCell>
                  <Avatar className="h-16 w-16 rounded-md">
                    <AvatarImage src={location.media.url} alt={location.caption} />
                    <AvatarFallback>{location.city.charAt(0)}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell>
                  <p className="font-medium">{location.city}, {location.country}</p>
                  <p className="text-sm text-muted-foreground truncate max-w-xs">{location.caption}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {location.hashtags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                  </div>
                </TableCell>
                <TableCell>
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={location.user.avatar.imageUrl} alt={location.user.name} />
                            <AvatarFallback>{location.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{location.user.name}</span>
                    </div>
                </TableCell>
                <TableCell>
                    <Button variant="destructive" size="icon" onClick={() => openRequestDialog(location)} disabled={isOwner}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Request Content Deletion</DialogTitle>
                <DialogDescription>
                    Provide a reason for deleting this content. This request will be sent to the app owner for approval.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="reason" className="text-right">
                        Reason
                    </Label>
                    <Textarea
                        id="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="col-span-3"
                        placeholder="e.g., Content is inappropriate or spam."
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="secondary" onClick={() => setIsRequestDialogOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleRequestDeletion}>Request Deletion</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
