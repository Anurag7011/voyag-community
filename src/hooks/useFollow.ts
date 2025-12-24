
'use client';

import { useState, useCallback } from 'react';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import {
  getFollowerDocRef,
  getUserDocRef,
} from '@/lib/firestore';
import {
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { toast } from './use-toast';

export const useFollow = (targetUserId?: string) => {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);

  // Memoize the follower document reference to check if the current user is following the target user.
  const followerDocRef = useMemoFirebase(() => {
    if (!targetUserId || !currentUser?.uid) return null;
    return getFollowerDocRef(firestore, targetUserId, currentUser.uid);
  }, [firestore, targetUserId, currentUser?.uid]);

  // Use the useDoc hook to get the real-time status of the follow relationship.
  const { data: followDoc, isLoading: isFollowDocLoading } = useDoc(followerDocRef);
  const isFollowing = !!followDoc;


  const toggleFollow = useCallback(async () => {
    if (!currentUser || !targetUserId || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to follow users.',
      });
      return;
    }
    
    if(currentUser.uid === targetUserId) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: "You cannot follow yourself.",
        });
        return;
    }

    setIsLoading(true);

    try {
      await runTransaction(firestore, async (transaction) => {
        const currentUserRef = getUserDocRef(firestore, currentUser.uid);
        const targetUserRef = getUserDocRef(firestore, targetUserId);
        const followerRef = getFollowerDocRef(firestore, targetUserId, currentUser.uid);

        const [currentUserDoc, targetUserDoc, currentFollowDoc] = await Promise.all([
          transaction.get(currentUserRef),
          transaction.get(targetUserRef),
          transaction.get(followerRef),
        ]);
        
        if (!currentUserDoc.exists() || !targetUserDoc.exists()) {
          throw new Error("User profiles not found.");
        }

        const isCurrentlyFollowing = currentFollowDoc.exists();

        if (isCurrentlyFollowing) {
          // --- Unfollow Logic ---
          transaction.delete(followerRef);
          
          // Decrement target user's follower count
          transaction.update(targetUserRef, {
            followers: (targetUserDoc.data().followers || 1) - 1,
          });

          // Decrement current user's following count
          transaction.update(currentUserRef, {
            following: (currentUserDoc.data().following || 1) - 1,
          });
          
        } else {
          // --- Follow Logic ---
          transaction.set(followerRef, { followedAt: serverTimestamp() });
          
           // Increment target user's follower count
          transaction.update(targetUserRef, {
            followers: (targetUserDoc.data().followers || 0) + 1,
          });
          
          // Increment current user's following count
          transaction.update(currentUserRef, {
            following: (currentUserDoc.data().following || 0) + 1,
          });
        }
      });
      
      toast({
        title: isFollowing ? 'Unfollowed' : 'Followed',
        description: `You have successfully ${isFollowing ? 'unfollowed' : 'followed'} this user.`,
      });

    } catch (error: any) {
        console.error('Follow/Unfollow transaction failed: ', error);
        toast({
            variant: 'destructive',
            title: 'Action Failed',
            description: error.message || 'Could not complete the follow/unfollow action.',
        });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, targetUserId, firestore, isFollowing]);

  return { 
    isFollowing, 
    toggleFollow, 
    isLoading: isLoading || isFollowDocLoading 
  };
};
