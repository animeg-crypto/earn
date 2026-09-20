# Top Up & Earn

This is a simple example of a top-up and bonus page that can connect to Stripe for real credit-card payments.

## Requirements

- Node.js 18+
- A Stripe account
- A Stripe secret key

## Setup

1. Copy `.env.example` to `.env`
2. Add your Stripe secret key:
   ```bash
   STRIPE_SECRET_KEY=sk_test_...
   PORT=3000
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the app:
   ```bash
   npm start
   ```
5. Open http://localhost:3000

## Real payment flow

- The browser selects a top-up amount.
- The frontend sends the amount to `/create-checkout-session`.
- The server creates a Stripe Checkout session.
- Stripe securely collects the card details.
- Stripe redirects the buyer back to success page after a successful payment.
- A webhook can be used to confirm the purchase and update your own database.

## Important

- Never store raw card data in your own app.
- Keep your Stripe secret key in `.env` and never expose it to the frontend.
- Use Stripe webhooks for reliable payment confirmation.
- Add your own database and user wallet logic for production.

## Example next step

Add your own backend logic to save the transaction and credit the user wallet after a confirmed payment event.
