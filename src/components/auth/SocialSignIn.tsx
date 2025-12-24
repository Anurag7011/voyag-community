'use client';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';

type SocialSignInProps = {
  isSignUp?: boolean;
}

export function SocialSignIn({ isSignUp = false }: SocialSignInProps) {
  const auth = useAuth();
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    try {
      await initiateGoogleSignIn(auth);
      toast({
        title: 'Signed in with Google!',
        description: 'Welcome to VOYAĠ.',
      });
      router.push('/profile');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Google Sign-In Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
        <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
          <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-72.2 72.2C321.7 103.6 287.4 88 248 88c-86.1 0-156 69.9-156 156s69.9 156 156 156c97.2 0 134.4-67.3 140.2-101.6H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path>
        </svg>
        {isSignUp ? 'Sign up with Google' : 'Sign in with Google'}
      </Button>
    </div>
  );
}
