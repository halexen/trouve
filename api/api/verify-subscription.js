const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    // Cherche le customer par email
    const customers = await stripe.customers.list({ email, limit: 1 });
    
    if (!customers.data.length) {
      return res.status(200).json({ isSubscribed: false, plan: null });
    }

    const customer = customers.data[0];

    // Vérifie les subscriptions actives
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1,
    });

    if (!subscriptions.data.length) {
      return res.status(200).json({ isSubscribed: false, plan: null });
    }

    const sub = subscriptions.data[0];
    const priceId = sub.items.data[0].price.id;

    // Détermine le plan
    let plan = 'starter';
    if (priceId === process.env.STRIPE_PRICE_PRO) plan = 'pro';
    if (priceId === process.env.STRIPE_PRICE_UNLIMITED) plan = 'unlimited';

    return res.status(200).json({
      isSubscribed: true,
      plan,
      email,
      customerId: customer.id,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
