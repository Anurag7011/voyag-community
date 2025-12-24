
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { getDeletionRequestsCollectionRef } from '@/lib/firestore';
import { type DeletionRequest } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { useAdmin } from '@/hooks/useAdmin';
import { handleDeletionRequest } from '@/lib/admin';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export default function AdminModerationPage() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { isOwner } = useAdmin();

  const requestsQuery = useMemoFirebase(() => {
    if (!isOwner || !firestore) return null;
    return getDeletionRequestsCollectionRef(firestore);
  }, [firestore, isOwner]);

  const { data: requests, isLoading } = useCollection<DeletionRequest>(requestsQuery);

  const [processingId, setProcessingId] = useState<string | null>(null);

  const pendingRequests = requests?.filter(req => req.status === 'pending') ?? [];
  const processedRequests = requests?.filter(req => req.status !== 'pending') ?? [];

  const handleRequest = async (requestId: string, action: 'approve' | 'reject') => {
    if (!currentUser) {
      toast({ variant: 'destructive', title: 'Authentication Error' });
      return;
    }
    setProcessingId(requestId);
    try {
      const idToken = await currentUser.getIdToken(true); // Force refresh the token
      await handleDeletionRequest(idToken, requestId, action);
      toast({ title: `Request ${action === 'approve' ? 'Approved' : 'Rejected'}` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Action Failed', description: error.message });
    } finally {
      setProcessingId(null);
    }
  };

  const renderContentDetails = (request: DeletionRequest) => {
    const { targetContent, targetType } = request;
    
    switch (targetType) {
        case 'location':
            return <p>Location: "{(targetContent as any).caption}" by {(targetContent as any).user.name}</p>;
        case 'event':
            return <p>Event: "{(targetContent as any).title}" by {(targetContent as any).user.name}</p>;
        case 'group':
            return <p>Group: "{(targetContent as any).country}"</p>;
        case 'product':
            return <p>Product: "{(targetContent as any).name}"</p>;
        default:
            return <p>Unknown content type.</p>;
    }
  };

  if (isLoading) {
    return <div className="container mx-auto py-8">Loading moderation requests...</div>
  }


  return (
    <>
      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
            <CardDescription>
              Review and act on deletion requests from admins.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isLoading && pendingRequests.length === 0 && (
                <p className="text-muted-foreground text-center py-8">No pending requests.</p>
            )}
            <Accordion type="single" collapsible className="w-full">
              {pendingRequests.map((request) => (
                <AccordionItem value={request.id} key={request.id}>
                  <AccordionTrigger>
                    <div className='flex items-center gap-4'>
                        <Avatar className="h-9 w-9">
                            <AvatarFallback>{request.requesterName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            {renderContentDetails(request)}
                            <p className="text-xs text-muted-foreground">
                                Requested by {request.requesterName} - {request.createdAt ? formatDistanceToNow(request.createdAt.toDate(), { addSuffix: true }) : ''}
                            </p>
                        </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="font-semibold mb-2">Admin's Reason:</p>
                        <p className="text-muted-foreground italic mb-4">"{request.reason}"</p>
                        <div className="flex justify-end gap-2">
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRequest(request.id, 'approve')}
                                disabled={processingId === request.id}
                            >
                                <Check className="mr-2 h-4 w-4" /> Approve Deletion
                            </Button>
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleRequest(request.id, 'reject')}
                                disabled={processingId === request.id}
                            >
                                <X className="mr-2 h-4 w-4" /> Reject Request
                            </Button>
                        </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
        <Card>
           <CardHeader>
            <CardTitle>Processed Requests</CardTitle>
            <CardDescription>A log of all past moderation actions.</CardDescription>
          </CardHeader>
          <CardContent>
            {!isLoading && processedRequests.length === 0 && (
                <p className="text-muted-foreground text-center py-8">No processed requests yet.</p>
            )}
            <div className="space-y-4">
                {processedRequests.map(request => (
                    <div key={request.id} className="flex items-center justify-between p-3 border rounded-md">
                        <div>
                            {renderContentDetails(request)}
                            <p className="text-xs text-muted-foreground">Reason: {request.reason}</p>
                        </div>
                        <Badge variant={request.status === 'approved' ? 'default' : 'destructive'}>
                            {request.status}
                        </Badge>
                    </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
