'use client';

import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Settings,
  CheckCircle,
  AlertCircle,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

interface ReferralConfig {
  benefitType: 'free_subscription' | 'discount_percentage' | 'bonus_credits';
  benefitValue: string;
  planId?: string | null;
  discountPercentage?: string | null;
  validityDays?: string | null;
  isActive: boolean;
}

export function ReferralConfigPanel() {
  const [config, setConfig] = useState<ReferralConfig>({
    benefitType: 'bonus_credits',
    benefitValue: '10000',
    planId: null,
    discountPercentage: null,
    validityDays: null,
    isActive: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveResult, setSaveResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/referral/config');

      if (!response.ok) {
        throw new Error('Failed to fetch referral configuration');
      }

      const data = await response.json();
      setConfig(data);
    } catch (error) {
      setError('Failed to load referral configuration');
      console.error('Error fetching config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveResult(null);
    setError(null);

    try {
      const response = await fetch('/api/admin/referral/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update configuration');
      }

      setSaveResult({
        success: true,
        message: 'Referral configuration updated successfully!',
      });
      toast.success('Configuration saved successfully!');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to save configuration';
      setSaveResult({
        success: false,
        message,
      });
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfigChange = (field: keyof ReferralConfig, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
    setSaveResult(null);
  };

  const formatCurrency = (amount: string) => {
    const value = parseFloat(amount || '0');
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="size-5" />
            Referral Configuration
          </CardTitle>
          <CardDescription>
            Configure referral program benefits and settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="size-5" />
          Referral Configuration
        </CardTitle>
        <CardDescription>
          Configure referral program benefits and settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="size-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {saveResult && (
          <Alert
            className={
              saveResult.success
                ? 'border-green-200 bg-green-50'
                : 'border-red-200 bg-red-50'
            }
          >
            <div className="flex items-start gap-2">
              {saveResult.success ? (
                <CheckCircle className="size-4 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="size-4 text-red-600 mt-0.5" />
              )}
              <AlertDescription
                className={
                  saveResult.success ? 'text-green-800' : 'text-red-800'
                }
              >
                {saveResult.message}
              </AlertDescription>
            </div>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Benefit Type */}
          <div className="space-y-2">
            <Label htmlFor="benefit-type">Benefit Type</Label>
            <Select
              value={config.benefitType}
              onValueChange={(value: ReferralConfig['benefitType']) =>
                handleConfigChange('benefitType', value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select benefit type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bonus_credits">Bonus Credits</SelectItem>
                <SelectItem value="discount_percentage">
                  Discount Percentage
                </SelectItem>
                <SelectItem value="free_subscription">
                  Free Subscription
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Benefit Value */}
          <div className="space-y-2">
            <Label htmlFor="benefit-value">
              {config.benefitType === 'bonus_credits' && 'Credit Amount (IDR)'}
              {config.benefitType === 'discount_percentage' &&
                'Discount Percentage (%)'}
              {config.benefitType === 'free_subscription' &&
                'Subscription Duration (months)'}
            </Label>
            <Input
              id="benefit-value"
              type="number"
              value={config.benefitValue}
              onChange={(e) =>
                handleConfigChange('benefitValue', e.target.value)
              }
              placeholder={
                config.benefitType === 'bonus_credits'
                  ? '10000'
                  : config.benefitType === 'discount_percentage'
                    ? '10'
                    : '1'
              }
            />
            {config.benefitType === 'bonus_credits' && (
              <p className="text-xs text-muted-foreground">
                Preview: {formatCurrency(config.benefitValue)}
              </p>
            )}
          </div>

          {/* Plan ID (for free subscription) */}
          {config.benefitType === 'free_subscription' && (
            <div className="space-y-2">
              <Label htmlFor="plan-id">Plan ID</Label>
              <Input
                id="plan-id"
                value={config.planId || ''}
                onChange={(e) => handleConfigChange('planId', e.target.value)}
                placeholder="e.g., basic, premium"
              />
              <p className="text-xs text-muted-foreground">
                The subscription plan to grant for free
              </p>
            </div>
          )}

          {/* Discount Percentage (for discount type) */}
          {config.benefitType === 'discount_percentage' && (
            <div className="space-y-2">
              <Label htmlFor="discount-percentage">Discount Percentage</Label>
              <Input
                id="discount-percentage"
                type="number"
                min="1"
                max="100"
                value={config.discountPercentage || ''}
                onChange={(e) =>
                  handleConfigChange('discountPercentage', e.target.value)
                }
                placeholder="10"
              />
              <p className="text-xs text-muted-foreground">
                Percentage discount on subscription (1-100%)
              </p>
            </div>
          )}

          {/* Validity Days */}
          <div className="space-y-2">
            <Label htmlFor="validity-days">Validity Period (days)</Label>
            <Input
              id="validity-days"
              type="number"
              value={config.validityDays || ''}
              onChange={(e) =>
                handleConfigChange('validityDays', e.target.value)
              }
              placeholder="30"
            />
            <p className="text-xs text-muted-foreground">
              How long the benefit remains valid (leave empty for no expiration)
            </p>
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Preview</h4>
          <p className="text-sm text-muted-foreground">
            {config.benefitType === 'bonus_credits' &&
              `Users will receive ${formatCurrency(config.benefitValue)} in bonus credits when they refer someone.`}
            {config.benefitType === 'discount_percentage' &&
              `Users will receive a ${config.discountPercentage || 0}% discount on their next subscription when they refer someone.`}
            {config.benefitType === 'free_subscription' &&
              `Users will receive a free ${config.benefitValue}-month ${config.planId || 'subscription'} when they refer someone.`}
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : (
              <Save className="size-4 mr-2" />
            )}
            Save Configuration
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
