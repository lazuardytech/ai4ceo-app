# Voucher & Subscription Management System

This document describes the comprehensive voucher and subscription management system that has been implemented in the AI4CEO Chat application.

## Overview

The system implements:
- **Default Free Users**: All new users start as regular users without subscriptions
- **Comprehensive Subscription Management**: View all users and their subscription status
- **Voucher System**: Discount codes and free subscription vouchers with validation and usage tracking

## Features

### 1. User Registration Changes
- All new users are created as `role: 'user'` by default (no subscriptions)
- Users can upgrade to premium through payment or voucher codes
- Free users can access basic functionality

### 2. Subscription Management (Admin)
- View all users with their subscription status at `/admin/subscriptions`
- Shows both subscribed and free users in a unified view
- Filter and search functionality for user management
- Real-time subscription status tracking

### 3. Voucher Management System

#### Voucher Types
1. **Discount Vouchers**
   - Percentage-based discounts (e.g., 10%, 25%)
   - Fixed amount discounts (e.g., 25,000 IDR)
   - Applied to next subscription purchase

2. **Free Subscription Vouchers**
   - Grant immediate premium access
   - Configurable duration (1 month, 3 months, 1 year)
   - Specific plan targeting (premium_monthly, etc.)

#### Voucher Features
- **Code Validation**: Case-insensitive, automatic uppercase conversion
- **Usage Limits**: Maximum number of uses per voucher
- **Time Restrictions**: Valid from/until date ranges
- **User Restrictions**: One use per user per voucher
- **Admin Management**: Create, edit, disable, and delete vouchers

## Database Schema

### New Tables

#### Voucher Table
```sql
CREATE TABLE "Voucher" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" varchar(64) UNIQUE NOT NULL,
  "type" varchar NOT NULL, -- 'discount' | 'free_subscription'
  "discountType" varchar, -- 'percentage' | 'fixed'
  "discountValue" varchar(16),
  "planId" varchar(64),
  "duration" varchar(32), -- '1_month', '3_months', '1_year'
  "maxUsages" varchar(16),
  "currentUsages" varchar(16) DEFAULT '0',
  "isActive" boolean DEFAULT true,
  "validFrom" timestamp NOT NULL,
  "validUntil" timestamp,
  "createdAt" timestamp NOT NULL,
  "updatedAt" timestamp NOT NULL
);
```

#### VoucherUsage Table
```sql
CREATE TABLE "VoucherUsage" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "voucherId" uuid REFERENCES "Voucher"("id"),
  "userId" uuid REFERENCES "User"("id"),
  "subscriptionId" uuid REFERENCES "Subscription"("id"),
  "usedAt" timestamp NOT NULL,
  "createdAt" timestamp NOT NULL
);
```

## API Endpoints

### User-Facing APIs
- `POST /api/voucher/validate` - Validate voucher code
- `POST /api/voucher/apply` - Apply voucher code

### Admin APIs
- `GET /admin/api/vouchers/list` - List all vouchers (paginated)
- `POST /admin/api/vouchers/create` - Create new voucher
- `POST /admin/api/vouchers/update` - Update voucher settings
- `POST /admin/api/vouchers/delete` - Delete voucher
- `GET /admin/api/users/subscription-status` - List users with subscription status

## User Interface

### For Regular Users

#### Billing Page (`/billing`)
- Shows current subscription status (Free User, Active, Expired, etc.)
- Voucher application form with real-time validation
- Subscription upgrade options
- Clear status indicators with badges

#### Voucher Application Component
- Real-time code validation
- Clear success/error messaging
- Automatic uppercase conversion
- Detailed usage instructions

### For Administrators

#### Voucher Management (`/admin/vouchers`)
- Create new vouchers with full configuration
- View all vouchers with usage statistics
- Edit voucher settings (active status, max uses, expiry)
- Delete vouchers (removes usage history)
- Search and filter capabilities

#### Subscription Management (`/admin/subscriptions`)
- View all users and their subscription status
- Shows free users alongside premium subscribers
- Filter by email, plan, or status
- Color-coded status indicators

## Usage Examples

### Creating Vouchers

#### Discount Voucher (20% off)
```
Code: WELCOME20
Type: Discount
Discount Type: Percentage
Discount Value: 20
Valid From: 2024-01-01
Valid Until: 2024-12-31
Max Uses: 100
```

#### Free Subscription Voucher
```
Code: FREEMONTH
Type: Free Subscription
Plan ID: premium_monthly
Duration: 1_month
Valid From: 2024-01-01
Valid Until: 2024-01-31
Max Uses: 50
```

### Applying Vouchers

Users can apply vouchers at `/billing`:
1. Enter voucher code (case-insensitive)
2. Click "Validate" to check if code is valid
3. If valid, click "Apply" to activate
4. Free subscription vouchers activate immediately
5. Discount vouchers are saved for next purchase

## Validation Rules

### Voucher Validation
- ✅ Code exists and is active
- ✅ Current date is within valid date range
- ✅ Usage limit not exceeded
- ✅ User hasn't used this voucher before
- ✅ For free subscriptions: user doesn't have active subscription

### Error Messages
- "Voucher not found"
- "Voucher is inactive"
- "Voucher is not yet valid"
- "Voucher has expired"
- "Voucher usage limit reached"
- "Voucher already used by this user"

## Database Functions

### Core Voucher Functions
- `createVoucher()` - Create new voucher
- `getVoucherByCode()` - Retrieve voucher by code
- `validateVoucher()` - Validate voucher for user
- `applyVoucher()` - Apply voucher and record usage
- `updateVoucher()` - Update voucher settings
- `deleteVoucher()` - Delete voucher and usage history
- `listVouchersPaged()` - Paginated voucher listing

### User Management Functions
- `listUsersWithSubscriptionStatus()` - Get all users with subscription info

## Security Considerations

### Access Control
- Voucher management requires `superadmin` role
- User voucher application requires authentication
- Voucher codes are case-insensitive but stored uppercase

### Data Validation
- Server-side validation for all voucher operations
- Usage tracking prevents double-application
- Date validation for voucher validity periods

## Installation & Setup

### Database Migration
The voucher tables are automatically created during the build process via the migration in `lib/db/migrations/0010_voucher_system.sql`.

### Required Environment Variables
No additional environment variables are required for the voucher system. It uses the existing database connection.

### Admin Access
To access voucher management:
1. Create a user account
2. Set the user's role to `superadmin` in the database:
   ```sql
   UPDATE "User" SET role = 'superadmin' WHERE email = 'admin@example.com';
   ```
3. Access admin panels at `/admin/vouchers` and `/admin/subscriptions`

## Testing

### Demo Vouchers
Create these vouchers for testing:
- `WELCOME10` - 10% discount
- `SAVE25K` - 25,000 IDR fixed discount
- `FREEMONTH` - 1 month free premium
- `PREMIUM3M` - 3 months free premium

### Test Scenarios
1. **New User Flow**: Register → View billing (shows "Free User") → Apply free voucher → Get premium access
2. **Discount Flow**: Apply discount voucher → See confirmation → Purchase subscription with discount
3. **Usage Limits**: Create limited voucher → Apply multiple times → Verify limit enforcement
4. **Expiry Testing**: Create expired voucher → Attempt to apply → Verify rejection
5. **Admin Management**: Create/edit/delete vouchers → Verify changes in user interface

## Monitoring & Analytics

### Admin Dashboard
- View voucher usage statistics
- Track user subscription conversions
- Monitor voucher effectiveness
- Identify popular voucher types

### Usage Tracking
- Each voucher application is logged in `VoucherUsage` table
- Track which vouchers lead to successful conversions
- Monitor voucher abuse or unusual usage patterns

## Future Enhancements

### Potential Features
- **Voucher Categories**: Group vouchers by campaign or purpose
- **User-Specific Vouchers**: Generate unique codes for individual users
- **Referral Vouchers**: Create vouchers for referral programs
- **Bulk Operations**: Create multiple vouchers at once
- **Export/Import**: CSV export of voucher data and bulk import
- **Analytics Dashboard**: Detailed voucher performance metrics
- **Automated Vouchers**: Generate vouchers based on user behavior
- **Email Integration**: Send voucher codes via email
- **Social Media Integration**: Share voucher codes on social platforms

### Technical Improvements
- **Rate Limiting**: Prevent voucher application spam
- **Caching**: Cache frequently accessed voucher data
- **Audit Trail**: Track all voucher modifications
- **Backup/Restore**: Voucher data backup procedures
- **API Rate Limiting**: Prevent abuse of voucher APIs