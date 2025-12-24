
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
  import { PlusCircle, Trash2, ExternalLink } from 'lucide-react';
  import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
  import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
  import { getCountryGroupsCollectionRef, getDeletionRequestsCollectionRef } from '@/lib/firestore';
  import { type CountryGroup } from '@/lib/types';
  import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from '@/components/ui/dialog';
  import { toast } from '@/hooks/use-toast';
  import { GroupForm } from '@/components/group/GroupForm';
  import { useState } from 'react';
import Link from 'next/link';
import { AdminNav } from '@/components/admin/AdminNav';
import { useAdmin } from '@/hooks/useAdmin';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { serverTimestamp } from 'firebase/firestore';
  
  export default function AdminGroupsPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { isOwner } = useAdmin();

    const [reason, setReason] = useState('');
    const [selectedGroup, setSelectedGroup] = useState<CountryGroup | null>(null);
    const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    const groupsQuery = useMemoFirebase(() => getCountryGroupsCollectionRef(firestore), [firestore]);
    const { data: groups, isLoading } = useCollection<CountryGroup>(groupsQuery);
  
    const handleRequestDeletion = () => {
        if (!selectedGroup || !user || !reason) {
            toast({variant: "destructive", title: "Missing Information", description: "A reason is required to request deletion."})
            return;
        };
        
        const requestsCollectionRef = getDeletionRequestsCollectionRef(firestore);
        addDocumentNonBlocking(requestsCollectionRef, {
            targetId: selectedGroup.id,
            targetType: 'group',
            targetContent: selectedGroup,
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
        setSelectedGroup(null);
        setReason('');
      };
    
      const openRequestDialog = (group: CountryGroup) => {
        setSelectedGroup(group);
        setIsRequestDialogOpen(true);
      }
  
    return (
        <>
        <AdminNav />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Manage Community Groups</CardTitle>
                <CardDescription>
                    Add or remove WhatsApp community groups for different countries.
                </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Country Group
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>Add a New Country Group</DialogTitle>
                    <DialogDescription>
                        Fill out the details to add a new country and its city groups.
                    </DialogDescription>
                </DialogHeader>
                <GroupForm onSubmitted={() => setIsAddDialogOpen(false)} />
            </DialogContent>
            </Dialog>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Country</TableHead>
                        <TableHead>City Groups</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading && (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center">Loading groups...</TableCell>
                        </TableRow>
                    )}
                    {!isLoading && groups && groups.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center">No groups found.</TableCell>
                        </TableRow>
                    )}
                    {groups?.map((group) => (
                        <TableRow key={group.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10 rounded-md">
                                        <AvatarImage src={group.image.imageUrl} alt={group.country} />
                                        <AvatarFallback>{group.country.slice(0, 2)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium text-lg">{group.flag} {group.country}</p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-2">
                                {group.groups.map(cityGroup => (
                                    <div key={cityGroup.city} className="flex items-center gap-2 text-sm">
                                        <span>{cityGroup.city}:</span>
                                        <Link href={cityGroup.whatsappLink} target="_blank" className="text-blue-500 hover:underline flex items-center gap-1 truncate">
                                            {cityGroup.whatsappLink} <ExternalLink className="h-3 w-3" />
                                        </Link>
                                    </div>
                                ))}
                                </div>
                            </TableCell>
                            <TableCell>
                               <Button variant="destructive" size="icon" onClick={() => openRequestDialog(group)} disabled={isOwner}>
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
