'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AuthForm } from './AuthForm';
import { Button, type ButtonProps } from '../ui/button';

type LoginDialogProps = {
    triggerText: string;
    variant?: ButtonProps['variant'];
}

export function LoginDialog({ triggerText, variant = 'outline' }: LoginDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={variant}>{triggerText}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className='text-center text-2xl font-headline'>Join the Community</DialogTitle>
        </DialogHeader>
        <AuthForm />
      </DialogContent>
    </Dialog>
  );
}
