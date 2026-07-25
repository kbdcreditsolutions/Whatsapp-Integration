const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const PLAN_PRICES = {
  starter: process.env.STRIPE_PRICE_STARTER || 'price_dummy_starter',
  pro: process.env.STRIPE_PRICE_PRO || 'price_dummy_pro',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE || 'price_dummy_enterprise',
};

router.post('/create-checkout-session', async (req, res) => {
  if (!stripe || !process.env.STRIPE_SECRET_KEY) return res.status(500).json({ error: 'Stripe is not configured.' });
  try {
    const { workspace_id, plan_type, success_url, cancel_url } = req.body;
    
    if (!workspace_id || !plan_type) return res.status(400).json({ error: 'Missing workspace_id or plan_type' });

    const priceId = PLAN_PRICES[plan_type];
    if (!priceId) return res.status(400).json({ error: 'Invalid plan type' });

    const { data: workspace } = await supabase.from('workspaces').select('stripe_customer_id').eq('id', workspace_id).single();

    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: success_url || `${req.headers.origin}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${req.headers.origin}/`,
      client_reference_id: workspace_id,
      metadata: { workspace_id: workspace_id, plan_type: plan_type }
    };

    if (workspace && workspace.stripe_customer_id) {
      sessionConfig.customer = workspace.stripe_customer_id;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/create-portal-session', async (req, res) => {
  if (!stripe || !process.env.STRIPE_SECRET_KEY) return res.status(500).json({ error: 'Stripe is not configured.' });
  try {
    const { workspace_id, return_url } = req.body;
    if (!workspace_id) return res.status(400).json({ error: 'Missing workspace_id' });

    const { data: workspace } = await supabase.from('workspaces').select('stripe_customer_id').eq('id', workspace_id).single();

    if (!workspace || !workspace.stripe_customer_id) {
      return res.status(400).json({ error: 'No active Stripe customer found for this workspace' });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: workspace.stripe_customer_id,
      return_url: return_url || `${req.headers.origin}/`,
    });

    res.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
