---
name: kurukoo-economic
description: Use when working with Kurukoo's economic layer including payments, transactions, economic dispatch, financial state, or monetary actions. Triggers on payment-related route handlers, balance checks, transaction tracking, cart operations, or economic route modifications. Preserves payment evidence-based state and canonical economic lifecycle.
license: MIT
metadata:
  author: temeaco-max
  version: '1.0.0'
---

# Kurukoo Economic Guide

Kurukoo's economic layer handles money-related actions that must remain evidence-based. Economic actions separate intention, request preparation, authorization, provider acceptance, payment, settlement, fulfilment, and confirmation.

## When to Use

- Modifying payment-related Express route handlers
- Adding or changing API endpoints for financial actions
- Working with user balances, payments, or transactions
- Updating cart operations or economic state management
- Implementing economic dispatch routes
- Handling payment provider integrations

## Economic Actions Principles

### 1. Separate Lifecycle Stages

Every economic action must preserve these stages:

| Stage | Description |
|-------|-------------|
| Intention | User expresses desire to perform economic action |
| Request Preparation | Prepare the request with required data |
| Authorization | Provider must accept the work |
| Payment | Actual money movement |
| Settlement | Transaction finalized |
| Fulfilment | Service delivered |
| Confirmation | User notified and system updated |

**Rule**: A UI state is not proof that an economic action succeeded.

### 2. Payment Provider Boundaries

Never simulate production integrations as real:

```typescript
// Good - show what's available
if (provider.status === 'available') {
  return renderPaymentUI(provider);
}

// Bad - claim provider accepted work because displayed
if (buttonPressed) {
  return claimPaymentSuccess(); // Don't simulate!
}
```

### 3. Economic State Verification

Only claim fulfilment occurred when actual evidence exists:

| Claim Type | Evidence Required |
|------------|-------------------|
| Payment made | Transaction receipt |
| Fulfilment occurred | Provider confirmation |
| Provider accepted | Provider response |
| Settlement complete | Settlement API response |

**Rule**: Truthful states are more important than optimistic UI states.

## API Handler Pattern

```typescript
router.post('/api/payments/process', authenticateUser, async (req, res) => {
  const { amount, reference } = req.body;
  
  // 1. Validate amount
  if (amount <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid amount' });
  }
  
  // 2. Check user balance (evidence-based)
  const balance = await getUserBalance(req.user.phone);
  if (balance < amount) {
    return res.status(402).json({ success: false, error: 'Insufficient funds' });
  }
  
  // 3. Check provider availability
  const providerStatus = await checkProviderStatus();
  if (providerStatus !== 'available') {
    return res.status(503).json({ success: false, error: 'Provider unavailable' });
  }
  
  // 4. Execute payment (evidence-based)
  const result = await paymentProvider.process(amount, reference, req.user.phone);
  
  // 5. Return standardized response
  return res.json({ 
    success: result.status === 'confirmed',
    paymentId: result.id,
    status: result.status 
  });
});
```

## Route Integration

### Economic Dispatch Routes

```typescript
const economicDispatchRoutes = express.Router();

economicDispatchRoutes.post('/initiate', authenticateUser, async (req, res) => {
  // ... payment initiation logic
});

economicDispatchRoutes.get('/status/:paymentId', authenticateUser, async (req, res) => {
  // ... payment status check
});

economicDispatchRoutes.get('/history', authenticateUser, async (req, res) => {
  // ... payment history
});

router.use('/api', economicDispatchRoutes);
```

**Rule**: All economic routes are mounted under `/api/` prefix.

## Cart Operations

### Cart State Management

```typescript
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  status: 'available' | 'reserved' | 'purchased';
}

interface CartState {
  items: CartItem[];
  total: number;
  userPhone: string;
}

// Load cart from canonical state
async function loadCart(phone: string): Promise<CartState> {
  return await cartService.load(phone);
}

// Save cart state
async function saveCart(cart: CartState): Promise<void> {
  await cartService.save(cart);
}
```

### Cart Operations

| Operation | Endpoint | Evidence Required |
|-----------|----------|-------------------|
| Add item | POST `/api/cart/items` | Item exists, user owns |
| Remove item | DELETE `/api/cart/items/:id` | Item in cart |
| Checkout | POST `/api/cart/checkout` | Payment method valid |
| Clear cart | DELETE `/api/cart` | Cart exists |

## Economic Checklist

- [ ] Separate lifecycle stages (intention → confirmation)
- [ ] Never simulate provider acceptance
- [ ] Only claim fulfilment with actual evidence
- [ ] Validate amounts before payment
- [ ] Check user balances evidence-based
- [ ] Use canonical economic dispatch routes
- [ ] Mount all economic routes under `/api/`
- [ ] Preserve truth over optimistic UI
- [ ] Maintain evidence trail for all actions