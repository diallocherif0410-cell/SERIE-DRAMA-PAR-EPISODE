import express from 'express';
import { db } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get subscription plans
router.get('/plans', (req, res) => {
  const plans = db.getCollection('subscription_plans');
  res.json(plans);
});

// Update plan
router.post('/update', authenticate, (req, res) => {
  const { planId } = req.body;
  const plans = db.getCollection('subscription_plans');
  const targetPlan = plans.find(p => p.id === planId);

  if (!targetPlan) {
    return res.status(400).json({ error: 'Formule d\'abonnement inconnue' });
  }

  const updatedUser = db.updateById('users', req.user.id, {
    plan: planId,
    subscriptionUpdatedAt: new Date().toISOString()
  });

  res.json({
    success: true,
    message: `Félicitations ! Vous êtes désormais abonné à l'offre ${targetPlan.name}.`,
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      plan: updatedUser.plan
    },
    plan: targetPlan
  });
});

export default router;
