const express = require('express');
const path = require('path');
const Stripe = require('stripe');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const TOP_UPS = {
  20: 2,
  50: 5,
  100: 12,
  200: 25
};

app.get('/health', (req, res) => {
  res.json({ ok: true, stripeConfigured: Boolean(stripe) });
});

app.post('/create-checkout-session', async (req, res) => {
  const amount = Number(req.body.amount);

  if (!TOP_UPS[amount]) {
    return res.status(400).json({ error: 'Invalid amount selected' });
  }

  if (!stripe) {
    return res.status(500).json({
      error: 'Stripe is not configured. Add STRIPE_SECRET_KEY to .env and restart the server.'
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Top Up Bonus - $${amount}`
          },
          unit_amount: amount * 100
        },
        quantity: 1
      }],
      success_url: `${req.protocol}://${req.get('host')}/success.html?amount=${amount}&bonus=${TOP_UPS[amount]}`,
      cancel_url: `${req.protocol}://${req.get('host')}/index.html`,
      metadata: {
        top_up_amount: String(amount),
        bonus_amount: String(TOP_UPS[amount]),
        source: 'topup-earn'
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Checkout creation failed:', error);
    res.status(500).json({ error: 'Unable to create checkout session' });
  }
});

app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  if (!stripe || !sig) {
    return res.status(400).send('Missing Stripe configuration or signature');
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error('Webhook signature failed:', error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const topUpAmount = Number(session.metadata?.top_up_amount || 0);
    const bonusAmount = Number(session.metadata?.bonus_amount || 0);
    const totalReceived = topUpAmount + bonusAmount;

    console.log(`Payment received: $${totalReceived} for top-up $${topUpAmount} + bonus $${bonusAmount}`);
  }

  res.json({ received: true });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
