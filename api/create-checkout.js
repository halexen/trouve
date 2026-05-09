const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { priceId, email } = req.body;
    const validPrices = [
      process.env.STRIPE_PRICE_STARTER,
      process.env.STRIPE_PRICE_PRO,
      process.env.STRIPE_PRICE_UNLIMITED,
    ];
    if (!validPrices.includes(priceId)) {
      return res.status(400).json({ error: 'Invalid price' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `https://trouve-app.netlify.app/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://trouve-app.netlify.app/cancel`,
      metadata: { email },
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
