'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getTokenStatus } from '@/app/utils/token';

export function TokenNotification() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    setMounted(true);
    const status = getTokenStatus();
    setShowNotification(status.isExpired);
  }, []);

  if (!mounted || !showNotification) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTitle>Roblox Security Token Required</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>
          Your Roblox security token has expired or is missing. Please update it in settings to continue using the application.
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/settings')}
        >
          Update Token
        </Button>
      </AlertDescription>
    </Alert>
  );
} 