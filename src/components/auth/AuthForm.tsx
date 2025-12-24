'use client';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { LoginForm } from './LoginForm';
import { SignUpForm } from './SignUpForm';
import { SocialSignIn } from './SocialSignIn';
import { Separator } from '../ui/separator';
import { Card, CardContent, CardHeader } from '../ui/card';

export function AuthForm() {
  return (
    <Card>
      <CardHeader className="pb-0">
        <SocialSignIn />
        <div className="relative py-4">
          <Separator />
          <span className="absolute left-1/2 -translate-x-1/2 -top-0.5 bg-card px-2 text-sm text-muted-foreground">
            OR
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="pt-6">
            <LoginForm />
          </TabsContent>
          <TabsContent value="signup" className="pt-6">
            <SignUpForm />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
