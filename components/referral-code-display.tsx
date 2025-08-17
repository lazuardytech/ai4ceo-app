'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, CheckCircle, Gift } from 'lucide-react';
import { toast } from 'sonner';

interface ReferralCodeDisplayProps {
  referralCode: string;
  className?: string;
}

export function ReferralCodeDisplay({
  referralCode,
  className,
}: ReferralCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      toast.success('Referral code copied to clipboard!');

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy referral code');
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="size-5" />
          Your Referral Code
        </CardTitle>
        <CardDescription>
          Share this code with friends to earn rewards when they sign up.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="referral-code">Referral Code</Label>
          <div className="flex gap-2">
            <Input
              id="referral-code"
              value={referralCode}
              readOnly
              className="font-mono text-lg font-bold text-center bg-muted"
            />
            <Button
              onClick={handleCopy}
              variant="outline"
              size="icon"
              className="shrink-0"
            >
              {copied ? (
                <CheckCircle className="size-4 text-green-600" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>
        </div>

        {copied && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="size-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Referral code copied to clipboard!
            </AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground space-y-1">
          <p>• Share this code with friends during their registration</p>
          <p>• Both you and your friend will receive benefits</p>
          <p>• Track your referral earnings in the history below</p>
        </div>
      </CardContent>
    </Card>
  );
}
