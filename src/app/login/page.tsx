'use client';
import { AuthForm } from '@/components/auth/AuthForm';

export default function LoginPage() {
  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-250px)] py-12">
      <div className="w-full max-w-md">
        <AuthForm />
      </div>
    </div>
  );
}
