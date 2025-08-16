# Testing Guide for Voucher & Subscription Management System

This guide will help you quickly test the new voucher and subscription management system.

## Quick Setup

### 1. Start the Application
```bash
cd ai4ceo-chat
pnpm dev
```

### 2. Create Test Users

#### Regular User
1. Go to http://localhost:3000/register
2. Register with:
   - Email: `user@test.com`
   - Password: `password123`

#### Admin User
1. Go to http://localhost:3000/register
2. Register with:
   - Email: `admin@test.com`
   - Password: `admin123`
3. Set admin role in database:
   ```sql
   UPDATE "User" SET role = 'superadmin' WHERE email = 'admin@test.com';
   ```

### 3. Create Test Vouchers (As Admin)

1. Login as `admin@test.com`
2. Go to http://localhost:3000/admin/vouchers
3. Create these test vouchers:

#### Free Premium Voucher
- Code: `FREEMONTH`
- Type: Free Subscription
- Plan ID: `premium_monthly`
- Duration: `1_month`
- Valid From: Today
- Valid Until: 7 days from now
- Max Uses: 50

#### Discount Voucher
- Code: `WELCOME20`
- Type: Discount
- Discount Type: Percentage
- Discount Value: `20`
- Valid From: Today
- Valid Until: 30 days from now
- Max Uses: 100

#### Limited Use Voucher
- Code: `LIMITED5`
- Type: Discount
- Discount Type: Fixed
- Discount Value: `25000`
- Valid From: Today
- Valid Until: 1 day from now
- Max Uses: 5

## Testing Scenarios

### Scenario 1: New User Flow
1. Login as `user@test.com`
2. Go to http://localhost:3000/billing
3. Verify status shows "Free User"
4. Apply voucher code `FREEMONTH`
5. Verify immediate upgrade to premium subscription
6. Check that subscription status updates

### Scenario 2: Voucher Validation
1. Try invalid codes: `INVALID`, `EXPIRED`, `USED`
2. Verify appropriate error messages
3. Try valid code `WELCOME20`
4. Verify validation success message

### Scenario 3: Usage Limits
1. Apply `LIMITED5` voucher
2. Logout and create another user
3. Apply `LIMITED5` again (repeat 5 times)
4. Verify usage limit enforcement on 6th attempt

### Scenario 4: Admin Management
1. Login as admin
2. Go to http://localhost:3000/admin/vouchers
3. View voucher usage statistics
4. Edit voucher settings (disable/enable)
5. Create new vouchers
6. Delete test vouchers

### Scenario 5: Subscription Overview
1. As admin, go to http://localhost:3000/admin/subscriptions
2. View all users and their subscription status
3. Verify free users and premium users are both shown
4. Test search and filtering

## Expected Results

### Free User Status
- Badge shows "Free User"
- No expiry date shown
- Voucher application form available
- Upgrade options displayed

### Premium User Status
- Badge shows "Active" (green)
- Expiry/renewal date shown
- Subscription details visible
- Plan ID displayed

### Voucher Application
- Valid codes show success message
- Invalid codes show specific error reasons
- Free subscription vouchers activate immediately
- Discount vouchers show confirmation message

### Admin Interface
- All vouchers listed with usage stats
- Create/edit/delete functionality works
- User subscription overview shows all users
- Search and filtering work correctly

## Common Issues & Solutions

### Database Connection
If you get database errors:
```bash
pnpm db:migrate
```

### Admin Access Denied
Ensure user role is set to 'superadmin':
```sql
SELECT email, role FROM "User" WHERE email = 'admin@test.com';
UPDATE "User" SET role = 'superadmin' WHERE email = 'admin@test.com';
```

### Voucher Not Found
Verify voucher was created successfully:
```sql
SELECT code, type, "isActive" FROM "Voucher" WHERE code = 'FREEMONTH';
```

### Migration Issues
If voucher tables don't exist:
```bash
pnpm db:generate
pnpm db:migrate
```

## Verification Checklist

- [ ] New users default to free accounts
- [ ] Voucher creation works in admin panel
- [ ] Voucher validation prevents invalid usage
- [ ] Free subscription vouchers activate immediately
- [ ] Discount vouchers show confirmation
- [ ] Usage limits are enforced
- [ ] Admin can view all user subscription statuses
- [ ] Expired vouchers are rejected
- [ ] Users can't apply same voucher twice
- [ ] Admin interface is secure (superadmin only)

## Database Queries for Debugging

### Check Vouchers
```sql
SELECT * FROM "Voucher" ORDER BY "createdAt" DESC;
```

### Check Voucher Usage
```sql
SELECT vu.*, v.code, u.email 
FROM "VoucherUsage" vu 
JOIN "Voucher" v ON vu."voucherId" = v.id 
JOIN "User" u ON vu."userId" = u.id 
ORDER BY vu."usedAt" DESC;
```

### Check User Subscriptions
```sql
SELECT u.email, u.role, s.status, s."planId", s."currentPeriodEnd"
FROM "User" u 
LEFT JOIN "Subscription" s ON u.id = s."userId" AND s.status = 'active'
ORDER BY u.email;
```

### Check All Tables
```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('Voucher', 'VoucherUsage');
```

## Success Criteria

The system is working correctly if:
1. All new users start as free users
2. Vouchers can be created and managed by admins
3. Valid vouchers apply successfully
4. Invalid vouchers are rejected with clear messages
5. Free subscription vouchers grant immediate access
6. Usage limits and expiry dates are enforced
7. Admin can see all users with subscription status
8. No duplicate voucher usage per user
9. Database integrity is maintained
10. All UI components render correctly