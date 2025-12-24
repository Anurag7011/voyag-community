'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/firebase';

// This function will be defined in admin.ts
import { setOwnerClaim } from '@/lib/admin';

export const useAdmin = () => {
  const { user, isUserLoading } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);

  const ownerEmail = process.env.NEXT_PUBLIC_APP_OWNER_EMAIL;

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (isUserLoading) {
        setIsAdminLoading(true);
        return;
      }

      if (!user) {
        setIsAdmin(false);
        setIsOwner(false);
        setIsAdminLoading(false);
        return;
      }

      try {
        let idTokenResult = await user.getIdTokenResult();
        let claims = idTokenResult.claims;

        // --- Self-Healing Owner Claim ---
        // Check if user is the owner by email but doesn't have the claim yet.
        if (user.email === ownerEmail && !claims.owner) {
          try {
            const idToken = await user.getIdToken();
            await setOwnerClaim(idToken);
            // Force a refresh of the token to get the new claims immediately.
            idTokenResult = await user.getIdTokenResult(true);
            claims = idTokenResult.claims;
            toast({ title: "Owner privileges established." });
          } catch (error) {
            console.error("Error setting owner claim:", error);
            // Proceed with current claims, but log the error.
          }
        }
        
        const userIsAdmin = !!claims.admin;
        const userIsOwner = !!claims.owner;

        setIsAdmin(userIsAdmin);
        setIsOwner(userIsOwner);

      } catch (error) {
        console.error("Error getting ID token result:", error);
        setIsAdmin(false);
        setIsOwner(false);
      } finally {
        setIsAdminLoading(false);
      }
    };

    checkAdminStatus();

  }, [user, isUserLoading, ownerEmail]);

  return { isAdmin, isOwner, isAdminLoading };
};
