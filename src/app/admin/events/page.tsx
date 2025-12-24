
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
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { getEventsCollectionRef, getDeletionRequestsCollectionRef } from '@/lib/firestore';
import { type Event } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog"
import { toast } from '@/hooks/use-toast';
import { AdminNav } from '@/components/admin/AdminNav';
import { useAdmin } from '@/hooks/useAdmin';
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { serverTimestamp } from 'firebase/firestore';
  

export default function AdminEventsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { isOwner } = useAdmin();

  const [reason, setReason] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);

  const eventsQuery = useMemoFirebase(() => getEventsCollectionRef(firestore), [firestore]);
  const { data: events, isLoading } = useCollection<Event>(eventsQuery);


  const handleRequestDeletion = () => {
    if (!selectedEvent || !user || !reason) {
        toast({variant: "destructive", title: "Missing Information", description: "A reason is required to request deletion."})
        return;
    };
    
    const requestsCollectionRef = getDeletionRequestsCollectionRef(firestore);
    addDocumentNonBlocking(requestsCollectionRef, {
        targetId: selectedEvent.id,
        targetType: 'event',
        targetContent: selectedEvent,
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
    setSelectedEvent(null);
    setReason('');
  };

  const openRequestDialog = (event: Event) => {
    setSelectedEvent(event);
    setIsRequestDialogOpen(true);
  }

  return (
    <>
    <AdminNav />
    <Card>
      <CardHeader>
        <CardTitle>Manage Events</CardTitle>
        <CardDescription>
          Review and moderate all user-submitted events.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Loading events...
                </TableCell>
              </TableRow>
            )}
             {!isLoading && events && events.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={4} className="text-center">
                        No events found.
                    </TableCell>
                </TableRow>
            )}
            {events?.map((event) => (
              <TableRow key={event.id}>
                <TableCell>
                  <Avatar className="h-16 w-16 rounded-md">
                    <AvatarImage src={event.media.url} alt={event.title} />
                    <AvatarFallback>{event.title.charAt(0)}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">{event.place}</p>
                </TableCell>
                 <TableCell>
                  <p className="text-sm">{event.date}</p>
                  <p className="text-sm text-muted-foreground">{event.time}</p>
                </TableCell>
                <TableCell>
                    <Button variant="destructive" size="icon" onClick={() => openRequestDialog(event)} disabled={isOwner}>
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
