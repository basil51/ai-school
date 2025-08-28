'use client';

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function UnsubscribeSuccessPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-xl">Successfully Unsubscribed</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {email ? (
              <>
                The email address <strong>{email}</strong> has been successfully unsubscribed from weekly progress reports.
              </>
            ) : (
              'You have been successfully unsubscribed from weekly progress reports.'
            )}
          </p>
          <p className="text-sm text-muted-foreground">
            You will no longer receive weekly progress emails. If you change your mind, you can re-enable them from your account settings.
          </p>
          <div className="pt-4">
            <Link href="/">
              <Button className="w-full">
                Return to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
