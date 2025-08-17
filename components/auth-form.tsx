import Form from 'next/form';

import { Input } from './ui/input';
import { Label } from './ui/label';

export function AuthForm({
  action,
  children,
  defaultEmail = '',
  showReferralCode = false,
  defaultReferralCode = '',
}: {
  action: NonNullable<
    string | ((formData: FormData) => void | Promise<void>) | undefined
  >;
  children: React.ReactNode;
  defaultEmail?: string;
  showReferralCode?: boolean;
  defaultReferralCode?: string;
}) {
  return (
    <Form action={action} className="flex flex-col gap-4 px-4 sm:px-16">
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="email"
          className="text-zinc-600 font-normal dark:text-zinc-400"
        >
          Email Address
        </Label>

        <Input
          id="email"
          name="email"
          className="bg-muted text-md md:text-sm"
          type="email"
          placeholder="user@acme.com"
          autoComplete="email"
          required
          autoFocus
          defaultValue={defaultEmail}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label
          htmlFor="password"
          className="text-zinc-600 font-normal dark:text-zinc-400"
        >
          Password
        </Label>

        <Input
          id="password"
          name="password"
          className="bg-muted text-md md:text-sm"
          type="password"
          required
        />
      </div>

      {showReferralCode && (
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="referralCode"
            className="text-zinc-600 font-normal dark:text-zinc-400"
          >
            Referral Code (Optional)
          </Label>

          <Input
            id="referralCode"
            name="referralCode"
            className="bg-muted text-md md:text-sm font-mono"
            type="text"
            placeholder="Enter referral code"
            defaultValue={defaultReferralCode}
            style={{ textTransform: 'uppercase' }}
            onChange={(e) => {
              e.target.value = e.target.value.toUpperCase();
            }}
          />
          <p className="text-xs text-muted-foreground">
            Have a referral code? Enter it to get special benefits!
          </p>
        </div>
      )}

      {children}
    </Form>
  );
}
