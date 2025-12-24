
'use client';

import { type User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Card, CardContent } from '../ui/card';
import { Users, Compass } from 'lucide-react';
import Link from 'next/link';
import { useFollow } from '@/hooks/useFollow';
import { useUser } from '@/firebase';
import { Button } from '../ui/button';
import { LoginDialog } from '../auth/LoginDialog';

type Props = {
  user: User;
};

export function UserSearchResultCard({ user }: Props) {
  const { user: currentUser } = useUser();
  const { isFollowing, toggleFollow, isLoading } = useFollow(user.id);
  const isOwnProfile = currentUser?.uid === user.id;

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent navigation if the follow button was clicked
    if ((e.target as HTMLElement).closest('button')) {
      e.preventDefault();
    }
  };


  const renderFollowButton = () => {
    if (isOwnProfile) return null;

    if (!currentUser) {
        return <LoginDialog triggerText="Follow" variant="default" />;
    }

    return (
        <Button variant={isFollowing ? 'secondary' : 'default'} onClick={toggleFollow} disabled={isLoading} size="sm">
            {isLoading ? '...' : isFollowing ? 'Unfollow' : 'Follow'}
        </Button>
    )
  }

  return (
    <Link href={`/profile/${user.username}`}>
      <Card className="hover:bg-muted/50 transition-colors" onClick={handleCardClick}>
        <CardContent className="p-4 flex gap-4 items-center">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.avatar.imageUrl} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-lg">{user.name}</p>
            {user.username && <p className="text-sm text-muted-foreground">@{user.username}</p>}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span className="text-xs">{user.followers || 0} Followers</span>
              </div>
              <div className="flex items-center gap-1">
                <Compass className="h-4 w-4" />
                 <span className="text-xs">{user.travelInterests?.slice(0, 2).join(', ') || 'General travel'}</span>
              </div>
            </div>
          </div>
          <div className="ml-auto">
            {renderFollowButton()}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
