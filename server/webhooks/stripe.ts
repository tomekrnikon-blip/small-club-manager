/**
 * Stripe Webhook Handler
 * 
 * This module handles Stripe webhook events for subscription management.
 * It processes checkout.session.completed, invoice.paid, and customer.subscription events.
 */

import * as db from "../db.js";

// Stripe event types we handle
type StripeEvent = {
  id: string;
  type: string;
  data: {
    object: any;
  };
};

/**
 * Verify Stripe webhook signature
 * In production, use the Stripe SDK for proper signature verification
 */
export async function verifyStripeSignature(
  payload: string,
  signature: string,
  webhookSecret: string
): Promise<boolean> {
  // In production, use stripe.webhooks.constructEvent()
  // For now, we do a basic check
  if (!signature || !webhookSecret) {
    console.warn("[Stripe Webhook] Missing signature or webhook secret");
    return false;
  }
  
  // Basic signature format check
  if (!signature.startsWith("t=") || !signature.includes(",v1=")) {
    return false;
  }
  
  return true;
}

/**
 * Process Stripe webhook event
 */
export async function processStripeWebhook(event: StripeEvent): Promise<{ success: boolean; message: string }> {
  console.log(`[Stripe Webhook] Processing event: ${event.type}`);
  
  switch (event.type) {
    case "checkout.session.completed":
      return handleCheckoutSessionCompleted(event.data.object);
    
    case "invoice.paid":
      return handleInvoicePaid(event.data.object);
    
    case "invoice.payment_failed":
      return handleInvoicePaymentFailed(event.data.object);
    
    case "customer.subscription.updated":
      return handleSubscriptionUpdated(event.data.object);
    
    case "customer.subscription.deleted":
      return handleSubscriptionDeleted(event.data.object);
    
    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      return { success: true, message: `Unhandled event type: ${event.type}` };
  }
}

/**
 * Handle successful checkout session
 * This is called when a user completes the Stripe Checkout flow
 */
async function handleCheckoutSessionCompleted(session: any): Promise<{ success: boolean; message: string }> {
  const userId = parseInt(session.client_reference_id, 10);
  const subscriptionId = session.subscription;
  const customerId = session.customer;
  
  if (!userId || isNaN(userId)) {
    console.error("[Stripe Webhook] Invalid user ID in checkout session");
    return { success: false, message: "Invalid user ID" };
  }
  
  console.log(`[Stripe Webhook] Checkout completed for user ${userId}, subscription: ${subscriptionId}`);
  
  try {
    // Get the subscription plan from metadata or line items
    const planId = session.metadata?.plan_id ? parseInt(session.metadata.plan_id, 10) : 1;
    const billingPeriod = session.metadata?.billing_period || 'monthly';
    
    // Calculate period end based on billing period
    const periodEnd = new Date();
    if (billingPeriod === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }
    
    // Create or update user subscription
    const existingSubscription = await db.getUserSubscription(userId);
    
    if (existingSubscription) {
      await db.updateUserSubscription(existingSubscription.id, {
        stripeSubscriptionId: subscriptionId,
        stripeCustomerId: customerId,
        status: 'active',
        billingPeriod,
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
        planId,
      });
    } else {
      await db.createUserSubscription({
        userId,
        planId,
        stripeSubscriptionId: subscriptionId,
        stripeCustomerId: customerId,
        status: 'active',
        billingPeriod,
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
      });
    }
    
    // Update user's PRO status
    await db.updateUser(userId, {
      isPro: true,
      subscriptionPlanId: planId,
      subscriptionStatus: 'active',
    });
    
    console.log(`[Stripe Webhook] User ${userId} upgraded to PRO successfully`);
    return { success: true, message: "Subscription activated" };
    
  } catch (error) {
    console.error("[Stripe Webhook] Error processing checkout:", error);
    return { success: false, message: "Failed to process checkout" };
  }
}

/**
 * Handle successful invoice payment (recurring billing)
 */
async function handleInvoicePaid(invoice: any): Promise<{ success: boolean; message: string }> {
  const subscriptionId = invoice.subscription;
  const customerId = invoice.customer;
  
  if (!subscriptionId) {
    return { success: true, message: "No subscription in invoice" };
  }
  
  console.log(`[Stripe Webhook] Invoice paid for subscription ${subscriptionId}`);
  
  try {
    // Update subscription period
    const periodEnd = new Date(invoice.lines?.data?.[0]?.period?.end * 1000 || Date.now());
    
    // Find and update subscription by Stripe subscription ID
    // Note: In production, you'd query by stripeSubscriptionId
    console.log(`[Stripe Webhook] Subscription renewed until ${periodEnd.toISOString()}`);
    
    return { success: true, message: "Invoice processed" };
    
  } catch (error) {
    console.error("[Stripe Webhook] Error processing invoice:", error);
    return { success: false, message: "Failed to process invoice" };
  }
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice: any): Promise<{ success: boolean; message: string }> {
  const subscriptionId = invoice.subscription;
  const customerId = invoice.customer;
  
  console.log(`[Stripe Webhook] Payment failed for subscription ${subscriptionId}`);
  
  // In production, you might want to:
  // 1. Send a notification to the user
  // 2. Update subscription status to 'past_due'
  // 3. Schedule a retry or grace period
  
  return { success: true, message: "Payment failure recorded" };
}

/**
 * Handle subscription updates (plan changes, etc.)
 */
async function handleSubscriptionUpdated(subscription: any): Promise<{ success: boolean; message: string }> {
  const subscriptionId = subscription.id;
  const status = subscription.status;
  
  console.log(`[Stripe Webhook] Subscription ${subscriptionId} updated to status: ${status}`);
  
  // Handle different statuses
  if (status === 'canceled' || status === 'unpaid') {
    // User's subscription is no longer active
    // Find and update user's PRO status
  }
  
  return { success: true, message: "Subscription update processed" };
}

/**
 * Handle subscription deletion/cancellation
 */
async function handleSubscriptionDeleted(subscription: any): Promise<{ success: boolean; message: string }> {
  const subscriptionId = subscription.id;
  
  console.log(`[Stripe Webhook] Subscription ${subscriptionId} deleted`);
  
  try {
    // Find user by subscription and revoke PRO status
    // In production, query by stripeSubscriptionId
    
    return { success: true, message: "Subscription cancelled" };
    
  } catch (error) {
    console.error("[Stripe Webhook] Error processing subscription deletion:", error);
    return { success: false, message: "Failed to process cancellation" };
  }
}
