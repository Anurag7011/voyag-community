
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { UserCog, Shield, ShieldOff, Trash2 } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { getUsersCollectionRef } from '@/lib/firestore';
import { type User as UserType } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { setAdminRole, deleteUserByAdmin } from '@/lib/admin';
import { AdminNav } from '@/components/admin/AdminNav';
import { useAdmin } from '@/hooks/useAdmin';
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

export default function AdminUsersPage() {
  const firestore = useFirestore();
  const { user: currentUser, isUserLoading } = useUser();
  const { isAdmin, isAdminLoading } = useAdmin();
  const [updatingUsers, setUpdatingUsers] = useState<string[]>([]);
  
  const ownerEmail = process.env.NEXT_PUBLIC_APP_OWNER_EMAIL;

  const usersQuery = useMemoFirebase(() => {
    // Only fetch users if the current user is an admin and auth is ready
    if (isUserLoading || isAdminLoading || !isAdmin || !firestore) return null;
    return getUsersCollectionRef(firestore);
  }, [firestore, isAdmin, isUserLoading, isAdminLoading]);
  const { data: users, isLoading } = useCollection<UserType>(usersQuery);


  const handleRoleChange = async (targetUserId: string, targetUserEmail: string, isAdminRole: boolean) => {
    if (!currentUser) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to perform this action.',
      });
      return;
    }
    
    setUpdatingUsers(prev => [...prev, targetUserId]);

    try {
      const idToken = await currentUser.getIdToken();
      await setAdminRole(idToken, targetUserId, isAdminRole);
      toast({
        title: 'Success',
        description: `${targetUserEmail} has been ${isAdminRole ? 'made an admin' : 'revoked from admin'}.`,
      });
      // Note: Custom claims can take a few minutes to propagate.
      // The UI may not update instantly without a page refresh or re-login.
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Update Role',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
        setUpdatingUsers(prev => prev.filter(id => id !== targetUserId));
    }
  };

  const handleDeleteUser = async (targetUserId: string, targetUserEmail: string) => {
    if (!currentUser) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in." });
        return;
    }
    
    setUpdatingUsers(prev => [...prev, targetUserId]);
    try {
        const idToken = await currentUser.getIdToken();
        await deleteUserByAdmin(idToken, targetUserId);
        toast({ title: "User Deleted", description: `The account for ${targetUserEmail} has been permanently deleted.` });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Deletion Failed", description: error.message || "Could not delete the user." });
    } finally {
        setUpdatingUsers(prev => prev.filter(id => id !== targetUserId));
    }
  };

  return (
    <>
    <AdminNav />
    <Card>
      <CardHeader>
        <CardTitle>Manage Users</CardTitle>
        <CardDescription>
          Assign or revoke admin privileges for users. Only the app owner can perform these actions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  Loading users...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && users && users.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  No users found.
                </TableCell>
              </TableRow>
            )}
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar.imageUrl} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {user.email === ownerEmail ? (
                     <Badge><Shield className="mr-2 h-4 w-4" />Owner</Badge>
                  ) : user.isAdmin ? (
                    <Badge variant="secondary"><UserCog className="mr-2 h-4 w-4" />Admin</Badge>
                  ) : (
                    <Badge variant="outline">User</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {user.email !== ownerEmail && currentUser?.email === ownerEmail && (
                     <>
                        {user.isAdmin ? (
                          <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRoleChange(user.id, user.email, false)}
                              disabled={updatingUsers.includes(user.id)}
                          >
                              <ShieldOff className="mr-2 h-4 w-4" />
                              {updatingUsers.includes(user.id) ? 'Updating...' : 'Revoke Admin'}
                          </Button>
                       ) : (
                          <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleRoleChange(user.id, user.email, true)}
                              disabled={updatingUsers.includes(user.id)}
                          >
                              <Shield className="mr-2 h-4 w-4" />
                              {updatingUsers.includes(user.id) ? 'Updating...' : 'Make Admin'}
                          </Button>
                       )}
                       <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    disabled={updatingUsers.includes(user.id)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {updatingUsers.includes(user.id) ? 'Deleting...' : 'Delete'}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Delete {user.name}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the user's account,
                                    all of their posts, and remove their data from our servers.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    className="bg-destructive hover:bg-destructive/90"
                                    onClick={() => handleDeleteUser(user.id, user.email)}
                                >
                                    Yes, delete user
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                     </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    </>
  );
}
