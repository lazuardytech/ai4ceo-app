'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface VoucherInfo {
  code: string;
  type: string;
  discountType?: string | null;
  discountValue?: string | null;
  planId?: string | null;
  duration?: string | null;
  description: string;
}

interface VoucherApplicationProps {
  onVoucherApplied?: () => void; // only from Client components
  refreshOnApplied?: boolean; // if true, router.refresh() after success
}

export function VoucherApplication({
  onVoucherApplied,
  refreshOnApplied = true,
}: VoucherApplicationProps) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message?: string;
    voucher?: VoucherInfo;
  } | null>(null);
  const [applicationResult, setApplicationResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleValidate = async () => {
    if (!code.trim()) return;

    setIsValidating(true);
    setValidationResult(null);
    setApplicationResult(null);

    try {
      const response = await fetch('/api/voucher/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });

      const result = await response.json();
      setValidationResult(result);
    } catch (error) {
      setValidationResult({
        valid: false,
        message: 'Failed to validate voucher code',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleApply = async () => {
    if (!validationResult?.valid) return;

    setIsApplying(true);
    setApplicationResult(null);

    try {
      const response = await fetch('/api/voucher/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });

      const result = await response.json();
      setApplicationResult(result);

      if (result.success) {
        setCode('');
        setValidationResult(null);
        if (onVoucherApplied) {
          onVoucherApplied();
        } else if (refreshOnApplied) {
          router.refresh();
        }
      }
    } catch (error) {
      setApplicationResult({
        success: false,
        message: 'Failed to apply voucher code',
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (!validationResult) {
        handleValidate();
      } else if (validationResult.valid) {
        handleApply();
      }
    }
  };

  return (
    <div className='border p-4 rounded-xl space-y-3'>
      <div>
        <span className="flex items-center gap-2 font-medium">
          Apply Voucher Code
        </span>
        <span className='text-sm'>
          Enter a discount code or free subscription voucher to apply to your
          account.
        </span>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              id="voucher-code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setValidationResult(null);
                setApplicationResult(null);
              }}
              onKeyPress={handleKeyPress}
              placeholder="Enter voucher code"
              disabled={isValidating || isApplying}
              className="font-mono"
            />
            {!validationResult ? (
              <Button
                onClick={handleValidate}
                disabled={!code.trim() || isValidating}
                variant="outline"
              >
                {isValidating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  'Validate'
                )}
              </Button>
            ) : validationResult.valid ? (
              <Button
                onClick={handleApply}
                disabled={isApplying}
                className="bg-green-600 hover:bg-green-700"
              >
                {isApplying ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  'Apply'
                )}
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setValidationResult(null);
                  setCode('');
                }}
                variant="outline"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Validation Result */}
        {validationResult && (
          <Alert
            className={
              validationResult.valid
                ? 'border-green-200 bg-green-50'
                : 'border-red-200 bg-red-50'
            }
          >
            <div className="flex items-start gap-2">
              {validationResult.valid ? (
                <CheckCircle className="size-4 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="size-4 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <AlertDescription>
                  {validationResult.valid ? (
                    <div>
                      <p className="font-medium text-green-800">
                        Valid voucher!
                      </p>
                      <p className="text-green-700 mt-1">
                        {validationResult.voucher?.description}
                      </p>
                      {validationResult.voucher?.type === 'discount' && (
                        <p className="text-sm text-green-600 mt-1">
                          This discount will be applied to your next
                          subscription purchase.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-red-800">{validationResult.message}</p>
                  )}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {/* Application Result */}
        {applicationResult && (
          <Alert
            className={
              applicationResult.success
                ? 'border-green-200 bg-green-50'
                : 'border-red-200 bg-red-50'
            }
          >
            <div className="flex items-start gap-2">
              {applicationResult.success ? (
                <CheckCircle className="size-4 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="size-4 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <AlertDescription>
                  <p
                    className={
                      applicationResult.success
                        ? 'text-green-800'
                        : 'text-red-800'
                    }
                  >
                    {applicationResult.message}
                  </p>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground">
          <p>
            • Voucher codes are case-insensitive and will be converted to
            uppercase
          </p>
          <p>• Each voucher can only be used once per user</p>
          <p>• Free subscription vouchers will activate immediately</p>
          <p>
            • Discount vouchers will be applied to your next subscription
            purchase
          </p>
        </div>
      </div>
    </div>
  );
}
