/**
 * Morpho Event Handlers
 * Combines event tracking (raw events) and state tracking (Market, Position, Authorization)
 */
import {
  Morpho,
  AdaptiveCurveIrm,
  VaultV2Factory,
  VaultV2,
  MetaMorphoFactory,
  MetaMorphoVault,
  MorphoMarketV1AdapterFactory,
  MorphoMarketV1AdapterV2Factory,
} from "generated";

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
  trackBorrowRateUpdate,
  trackCreateVaultV2,
  trackCreateLegacyVault,
  trackCreateMorphoMarketV1Adapter,
  trackVaultAllocate,
  trackCreateMorphoMarketV1AdapterV2,
  trackCreateMorphoMarketV1AdapterV2Factory,
  trackLegacyVaultDeposit,
  trackLegacyVaultReallocateSupply,
  trackLegacyVaultReallocateWithdraw,
  trackLegacyVaultWithdraw,
  trackVaultDeallocate,
  trackVaultDeposit,
  trackVaultForceDeallocate,
  trackVaultWithdraw,
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
  updateStateOnBorrowRateUpdate,
  updateStateOnCreateVaultV2,
  updateStateOnCreateLegacyVault,
  updateStateOnCreateMorphoMarketV1Adapter,
  updateStateOnCreateMorphoMarketV1AdapterV2,
  updateStateOnVaultAddAdapter,
  updateStateOnVaultDeposit,
  updateStateOnVaultRemoveAdapter,
  updateStateOnVaultSetAbsoluteCap,
  updateStateOnVaultSetAdapterRegistry,
  updateStateOnVaultSetCurator,
  updateStateOnVaultSetForceDeallocatePenalty,
  updateStateOnVaultSetIsAllocator,
  updateStateOnVaultSetIsSentinel,
  updateStateOnVaultSetManagementFee,
  updateStateOnVaultSetManagementFeeRecipient,
  updateStateOnVaultSetMaxRate,
  updateStateOnVaultSetName,
  updateStateOnVaultSetOwner,
  updateStateOnVaultSetPerformanceFee,
  updateStateOnVaultSetPerformanceFeeRecipient,
  updateStateOnVaultSetReceiveAssetsGate,
  updateStateOnVaultSetReceiveSharesGate,
  updateStateOnVaultSetRelativeCap,
  updateStateOnVaultSetSendAssetsGate,
  updateStateOnVaultSetSendSharesGate,
  updateStateOnVaultSetSymbol,
  updateStateOnVaultWithdraw,
} from "./stateTracking";
import {
  trackMorphoBlueTx,
  trackMarketBorrowTx,
  trackMarketLegacyReallocateSupplyTx,
  trackMarketLegacyReallocateWithdrawTx,
  trackMarketRepayTx,
  trackMarketSupplyCollateralTx,
  trackMarketSupplyTx,
  trackMarketWithdrawCollateralTx,
  trackMarketWithdrawTx,
  trackLegacyVaultCreateTx,
  trackLegacyVaultRebalanceTx,
  trackLegacyVaultUserDepositTx,
  trackLegacyVaultUserWithdrawTx,
  trackVaultConfigTx,
  trackVaultCreateTx,
  trackVaultRebalanceTx,
  trackVaultUserDepositTx,
  trackVaultUserWithdrawTx,
} from "./txTracking";

// ============================================
// Morpho Events with State Tracking
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
  await trackMorphoBlueTx(event, context);
  await trackMarketSupplyTx(event, context);
  // Update state
  await updateStateOnSupply(event, context);
});

Morpho.Withdraw.handler(async ({ event, context }) => {
  // Track raw event
  trackWithdraw(event, context);
  await trackMorphoBlueTx(event, context);
  await trackMarketWithdrawTx(event, context);
  // Update state
  await updateStateOnWithdraw(event, context);
});

Morpho.SupplyCollateral.handler(async ({ event, context }) => {
  // Track raw event
  trackSupplyCollateral(event, context);
  await trackMorphoBlueTx(event, context);
  await trackMarketSupplyCollateralTx(event, context);
  // Update state
  await updateStateOnSupplyCollateral(event, context);
});

Morpho.WithdrawCollateral.handler(async ({ event, context }) => {
  // Track raw event
  trackWithdrawCollateral(event, context);
  await trackMorphoBlueTx(event, context);
  await trackMarketWithdrawCollateralTx(event, context);
  // Update state
  await updateStateOnWithdrawCollateral(event, context);
});

Morpho.Borrow.handler(async ({ event, context }) => {
  // Track raw event
  trackBorrow(event, context);
  await trackMorphoBlueTx(event, context);
  await trackMarketBorrowTx(event, context);
  // Update state
  await updateStateOnBorrow(event, context);
});

Morpho.Repay.handler(async ({ event, context }) => {
  // Track raw event
  trackRepay(event, context);
  await trackMorphoBlueTx(event, context);
  await trackMarketRepayTx(event, context);
  // Update state
  await updateStateOnRepay(event, context);
});

Morpho.Liquidate.handler(async ({ event, context }) => {
  // Track raw event
  trackLiquidate(event, context);
  await trackMorphoBlueTx(event, context);
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
// Morpho Events without State Tracking (raw tracking only)
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

// ============================================
// AdaptiveCurveIrm Events
// ============================================

AdaptiveCurveIrm.BorrowRateUpdate.handler(async ({ event, context }) => {
  // Track raw event
  trackBorrowRateUpdate(event, context);
  // Cache only the IRM state needed by the next Morpho market-touch event.
  await updateStateOnBorrowRateUpdate(event, context);
});

// ============================================
// Adapter Factory Events
// ============================================

MetaMorphoFactory.CreateMetaMorpho.contractRegister(({ event, context }) => {
  context.addMetaMorphoVault(event.params.metaMorpho);
});

MetaMorphoFactory.CreateMetaMorpho.handler(async ({ event, context }) => {
  trackCreateLegacyVault(event, context);
  await trackLegacyVaultCreateTx(event, context);
  await updateStateOnCreateLegacyVault(event, context);
});

MetaMorphoVault.Deposit.handler(async ({ event, context }) => {
  trackLegacyVaultDeposit(event, context);
  await trackLegacyVaultUserDepositTx(event, context);
});

MetaMorphoVault.Withdraw.handler(async ({ event, context }) => {
  trackLegacyVaultWithdraw(event, context);
  await trackLegacyVaultUserWithdrawTx(event, context);
});

MetaMorphoVault.ReallocateSupply.handler(async ({ event, context }) => {
  trackLegacyVaultReallocateSupply(event, context);
  await trackLegacyVaultRebalanceTx(event, context);
  await trackMarketLegacyReallocateSupplyTx(event, context);
});

MetaMorphoVault.ReallocateWithdraw.handler(async ({ event, context }) => {
  trackLegacyVaultReallocateWithdraw(event, context);
  await trackLegacyVaultRebalanceTx(event, context);
  await trackMarketLegacyReallocateWithdrawTx(event, context);
});

MorphoMarketV1AdapterFactory.CreateMorphoMarketV1Adapter.handler(async ({ event, context }) => {
  trackCreateMorphoMarketV1Adapter(event, context);
  await updateStateOnCreateMorphoMarketV1Adapter(event, context);
});

MorphoMarketV1AdapterV2Factory.CreateMorphoMarketV1AdapterV2Factory.handler(
  async ({ event, context }) => {
    trackCreateMorphoMarketV1AdapterV2Factory(event, context);
  }
);

MorphoMarketV1AdapterV2Factory.CreateMorphoMarketV1AdapterV2.handler(
  async ({ event, context }) => {
    trackCreateMorphoMarketV1AdapterV2(event, context);
    await updateStateOnCreateMorphoMarketV1AdapterV2(event, context);
  }
);

// ============================================
// VaultV2 Events
// ============================================

VaultV2Factory.CreateVaultV2.contractRegister(({ event, context }) => {
  context.addVaultV2(event.params.newVaultV2);
});

VaultV2Factory.CreateVaultV2.handler(async ({ event, context }) => {
  trackCreateVaultV2(event, context);
  await trackVaultCreateTx(event, context);
  await updateStateOnCreateVaultV2(event, context);
});

VaultV2.AddAdapter.handler(async ({ event, context }) => {
  await trackVaultConfigTx(event, context);
  await updateStateOnVaultAddAdapter(event, context);
});

VaultV2.Allocate.handler(async ({ event, context }) => {
  trackVaultAllocate(event, context);
  await trackVaultRebalanceTx(event, context);
});

VaultV2.DecreaseAbsoluteCap.handler(async ({ event, context }) => {
  await trackVaultConfigTx(event, context);
  await updateStateOnVaultSetAbsoluteCap(event, context);
});

VaultV2.DecreaseRelativeCap.handler(async ({ event, context }) => {
  await trackVaultConfigTx(event, context);
  await updateStateOnVaultSetRelativeCap(event, context);
});

VaultV2.Deallocate.handler(async ({ event, context }) => {
  trackVaultDeallocate(event, context);
  await trackVaultRebalanceTx(event, context);
});

VaultV2.Deposit.handler(async ({ event, context }) => {
  trackVaultDeposit(event, context);
  await trackVaultUserDepositTx(event, context);
  await updateStateOnVaultDeposit(event, context);
});

VaultV2.ForceDeallocate.handler(async ({ event, context }) => {
  trackVaultForceDeallocate(event, context);
  await trackVaultRebalanceTx(event, context);
});

VaultV2.IncreaseAbsoluteCap.handler(async ({ event, context }) => {
  await trackVaultConfigTx(event, context);
  await updateStateOnVaultSetAbsoluteCap(event, context);
});

VaultV2.IncreaseRelativeCap.handler(async ({ event, context }) => {
  await trackVaultConfigTx(event, context);
  await updateStateOnVaultSetRelativeCap(event, context);
});

VaultV2.RemoveAdapter.handler(async ({ event, context }) => {
  await trackVaultConfigTx(event, context);
  await updateStateOnVaultRemoveAdapter(event, context);
});

VaultV2.SetAdapterRegistry.handler(async ({ event, context }) => {
  await trackVaultConfigTx(event, context);
  await updateStateOnVaultSetAdapterRegistry(event, context);
});

VaultV2.SetCurator.handler(async ({ event, context }) => {
  await trackVaultConfigTx(event, context);
  await updateStateOnVaultSetCurator(event, context);
});

VaultV2.SetForceDeallocatePenalty.handler(async ({ event, context }) => {
  await trackVaultConfigTx(event, context);
  await updateStateOnVaultSetForceDeallocatePenalty(event, context);
});

VaultV2.SetIsAllocator.handler(async ({ event, context }) => {
  await trackVaultConfigTx(event, context);
  await updateStateOnVaultSetIsAllocator(event, context);
});

VaultV2.SetIsSentinel.handler(async ({ event, context }) => {
  await trackVaultConfigTx(event, context);
  await updateStateOnVaultSetIsSentinel(event, context);
});

VaultV2.SetManagementFee.handler(async ({ event, context }) => {
  await trackVaultConfigTx(event, context);
  await updateStateOnVaultSetManagementFee(event, context);
});

VaultV2.SetManagementFeeRecipient.handler(async ({ event, context }) => {
  await trackVaultConfigTx(event, context);
  await updateStateOnVaultSetManagementFeeRecipient(event, context);
});

VaultV2.SetMaxRate.handler(async ({ event, context }) => {
  await trackVaultConfigTx(event, context);
  await updateStateOnVaultSetMaxRate(event, context);
});

VaultV2.SetName.handler(async ({ event, context }) => {
  await trackVaultConfigTx(event, context);
  await updateStateOnVaultSetName(event, context);
});

VaultV2.SetOwner.handler(async ({ event, context }) => {
  await trackVaultConfigTx(event, context);
  await updateStateOnVaultSetOwner(event, context);
});

VaultV2.SetPerformanceFee.handler(async ({ event, context }) => {
  await trackVaultConfigTx(event, context);
  await updateStateOnVaultSetPerformanceFee(event, context);
});

VaultV2.SetPerformanceFeeRecipient.handler(async ({ event, context }) => {
  await trackVaultConfigTx(event, context);
  await updateStateOnVaultSetPerformanceFeeRecipient(event, context);
});

VaultV2.SetReceiveAssetsGate.handler(async ({ event, context }) => {
  await trackVaultConfigTx(event, context);
  await updateStateOnVaultSetReceiveAssetsGate(event, context);
});

VaultV2.SetReceiveSharesGate.handler(async ({ event, context }) => {
  await trackVaultConfigTx(event, context);
  await updateStateOnVaultSetReceiveSharesGate(event, context);
});

VaultV2.SetSendAssetsGate.handler(async ({ event, context }) => {
  await trackVaultConfigTx(event, context);
  await updateStateOnVaultSetSendAssetsGate(event, context);
});

VaultV2.SetSendSharesGate.handler(async ({ event, context }) => {
  await trackVaultConfigTx(event, context);
  await updateStateOnVaultSetSendSharesGate(event, context);
});

VaultV2.SetSymbol.handler(async ({ event, context }) => {
  await trackVaultConfigTx(event, context);
  await updateStateOnVaultSetSymbol(event, context);
});

VaultV2.Withdraw.handler(async ({ event, context }) => {
  trackVaultWithdraw(event, context);
  await trackVaultUserWithdrawTx(event, context);
  await updateStateOnVaultWithdraw(event, context);
});
