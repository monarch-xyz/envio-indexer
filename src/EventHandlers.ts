/**
 * Morpho Event Handlers
 * Combines event tracking (raw events) and state tracking (Market, Position, Authorization)
 */
import { Morpho } from "generated";

// Event tracking - raw event entity storage
import {
  trackAccrueInterest,
  trackBorrow,
  trackCreateMarket,
  trackEnableIrm,
  trackEnableLltv,
  trackFlashLoan,
  trackIncrementNonce,
  trackLiquidate,
  trackRepay,
  trackSetAuthorization,
  trackSetFee,
  trackSetFeeRecipient,
  trackSetOwner,
  trackSupply,
  trackSupplyCollateral,
  trackWithdraw,
  trackWithdrawCollateral,
} from "./eventTracking";

// State tracking - Market, Position, Authorization updates
import {
  updateStateOnCreateMarket,
  updateStateOnSetFee,
  updateStateOnAccrueInterest,
  updateStateOnSupply,
  updateStateOnWithdraw,
  updateStateOnSupplyCollateral,
  updateStateOnWithdrawCollateral,
  updateStateOnBorrow,
  updateStateOnRepay,
  updateStateOnLiquidate,
  updateStateOnSetAuthorization,
} from "./stateTracking";

// ============================================
// Events with State Tracking
// ============================================

Morpho.CreateMarket.handler(async ({ event, context }) => {
  // Track raw event
  trackCreateMarket(event, context);
  // Update state
  await updateStateOnCreateMarket(event, context);
});

Morpho.SetFee.handler(async ({ event, context }) => {
  // Track raw event
  trackSetFee(event, context);
  // Update state
  await updateStateOnSetFee(event, context);
});

Morpho.AccrueInterest.handler(async ({ event, context }) => {
  // Track raw event
  trackAccrueInterest(event, context);
  // Update state
  await updateStateOnAccrueInterest(event, context);
});

Morpho.Supply.handler(async ({ event, context }) => {
  // Track raw event
  trackSupply(event, context);
  // Update state
  await updateStateOnSupply(event, context);
});

Morpho.Withdraw.handler(async ({ event, context }) => {
  // Track raw event
  trackWithdraw(event, context);
  // Update state
  await updateStateOnWithdraw(event, context);
});

Morpho.SupplyCollateral.handler(async ({ event, context }) => {
  // Track raw event
  trackSupplyCollateral(event, context);
  // Update state
  await updateStateOnSupplyCollateral(event, context);
});

Morpho.WithdrawCollateral.handler(async ({ event, context }) => {
  // Track raw event
  trackWithdrawCollateral(event, context);
  // Update state
  await updateStateOnWithdrawCollateral(event, context);
});

Morpho.Borrow.handler(async ({ event, context }) => {
  // Track raw event
  trackBorrow(event, context);
  // Update state
  await updateStateOnBorrow(event, context);
});

Morpho.Repay.handler(async ({ event, context }) => {
  // Track raw event
  trackRepay(event, context);
  // Update state
  await updateStateOnRepay(event, context);
});

Morpho.Liquidate.handler(async ({ event, context }) => {
  // Track raw event
  trackLiquidate(event, context);
  // Update state
  await updateStateOnLiquidate(event, context);
});

Morpho.SetAuthorization.handler(async ({ event, context }) => {
  // Track raw event
  trackSetAuthorization(event, context);
  // Update state
  await updateStateOnSetAuthorization(event, context);
});

// ============================================
// Events without State Tracking (raw tracking only)
// ============================================

Morpho.EnableIrm.handler(async ({ event, context }) => {
  trackEnableIrm(event, context);
});

Morpho.EnableLltv.handler(async ({ event, context }) => {
  trackEnableLltv(event, context);
});

Morpho.FlashLoan.handler(async ({ event, context }) => {
  trackFlashLoan(event, context);
});

Morpho.IncrementNonce.handler(async ({ event, context }) => {
  trackIncrementNonce(event, context);
});

Morpho.SetFeeRecipient.handler(async ({ event, context }) => {
  trackSetFeeRecipient(event, context);
});

Morpho.SetOwner.handler(async ({ event, context }) => {
  trackSetOwner(event, context);
});
