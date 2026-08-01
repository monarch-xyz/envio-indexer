/**
 * Morpho Event Handlers
 * Combines event tracking (raw events) and state tracking (Market, Position, Authorization)
 */
import { indexer } from "envio";

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
  trackCreateMorphoVaultV1Adapter,
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
  updateStateOnCreateMorphoVaultV1Adapter,
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

indexer.onEvent(
  { contract: "Morpho", event: "CreateMarket" },
  async ({ event, context }) => {
    // Track raw event
    trackCreateMarket(event, context);
    // Update state
    await updateStateOnCreateMarket(event, context);
  },
);

indexer.onEvent(
  { contract: "Morpho", event: "SetFee" },
  async ({ event, context }) => {
    // Track raw event
    trackSetFee(event, context);
    // Update state
    await updateStateOnSetFee(event, context);
  },
);

indexer.onEvent(
  { contract: "Morpho", event: "AccrueInterest" },
  async ({ event, context }) => {
    // Track raw event
    trackAccrueInterest(event, context);
    // Update state
    await updateStateOnAccrueInterest(event, context);
  },
);

indexer.onEvent(
  { contract: "Morpho", event: "Supply" },
  async ({ event, context }) => {
    // Track raw event
    trackSupply(event, context);
    await trackMorphoBlueTx(event, context);
    await trackMarketSupplyTx(event, context);
    // Update state
    await updateStateOnSupply(event, context);
  },
);

indexer.onEvent(
  { contract: "Morpho", event: "Withdraw" },
  async ({ event, context }) => {
    // Track raw event
    trackWithdraw(event, context);
    await trackMorphoBlueTx(event, context);
    await trackMarketWithdrawTx(event, context);
    // Update state
    await updateStateOnWithdraw(event, context);
  },
);

indexer.onEvent(
  { contract: "Morpho", event: "SupplyCollateral" },
  async ({ event, context }) => {
    // Track raw event
    trackSupplyCollateral(event, context);
    await trackMorphoBlueTx(event, context);
    await trackMarketSupplyCollateralTx(event, context);
    // Update state
    await updateStateOnSupplyCollateral(event, context);
  },
);

indexer.onEvent(
  { contract: "Morpho", event: "WithdrawCollateral" },
  async ({ event, context }) => {
    // Track raw event
    trackWithdrawCollateral(event, context);
    await trackMorphoBlueTx(event, context);
    await trackMarketWithdrawCollateralTx(event, context);
    // Update state
    await updateStateOnWithdrawCollateral(event, context);
  },
);

indexer.onEvent(
  { contract: "Morpho", event: "Borrow" },
  async ({ event, context }) => {
    // Track raw event
    trackBorrow(event, context);
    await trackMorphoBlueTx(event, context);
    await trackMarketBorrowTx(event, context);
    // Update state
    await updateStateOnBorrow(event, context);
  },
);

indexer.onEvent(
  { contract: "Morpho", event: "Repay" },
  async ({ event, context }) => {
    // Track raw event
    trackRepay(event, context);
    await trackMorphoBlueTx(event, context);
    await trackMarketRepayTx(event, context);
    // Update state
    await updateStateOnRepay(event, context);
  },
);

indexer.onEvent(
  { contract: "Morpho", event: "Liquidate" },
  async ({ event, context }) => {
    // Track raw event
    trackLiquidate(event, context);
    await trackMorphoBlueTx(event, context);
    // Update state
    await updateStateOnLiquidate(event, context);
  },
);

indexer.onEvent(
  { contract: "Morpho", event: "SetAuthorization" },
  async ({ event, context }) => {
    // Track raw event
    trackSetAuthorization(event, context);
    // Update state
    await updateStateOnSetAuthorization(event, context);
  },
);

// ============================================
// Morpho Events without State Tracking (raw tracking only)
// ============================================

indexer.onEvent(
  { contract: "Morpho", event: "EnableIrm" },
  async ({ event, context }) => {
    trackEnableIrm(event, context);
  },
);

indexer.onEvent(
  { contract: "Morpho", event: "EnableLltv" },
  async ({ event, context }) => {
    trackEnableLltv(event, context);
  },
);

indexer.onEvent(
  { contract: "Morpho", event: "FlashLoan" },
  async ({ event, context }) => {
    trackFlashLoan(event, context);
  },
);

indexer.onEvent(
  { contract: "Morpho", event: "IncrementNonce" },
  async ({ event, context }) => {
    trackIncrementNonce(event, context);
  },
);

indexer.onEvent(
  { contract: "Morpho", event: "SetFeeRecipient" },
  async ({ event, context }) => {
    trackSetFeeRecipient(event, context);
  },
);

indexer.onEvent(
  { contract: "Morpho", event: "SetOwner" },
  async ({ event, context }) => {
    trackSetOwner(event, context);
  },
);

// ============================================
// AdaptiveCurveIrm Events
// ============================================

indexer.onEvent(
  { contract: "AdaptiveCurveIrm", event: "BorrowRateUpdate" },
  async ({ event, context }) => {
    // Track raw event
    trackBorrowRateUpdate(event, context);
    // Cache only the IRM state needed by the next Morpho market-touch event.
    await updateStateOnBorrowRateUpdate(event, context);
  },
);

// ============================================
// Adapter Factory Events
// ============================================

indexer.contractRegister(
  { contract: "MetaMorphoFactory", event: "CreateMetaMorpho" },
  async ({ event, context }) => {
    context.chain.MetaMorphoVault.add(event.params.metaMorpho);
  },
);

indexer.onEvent(
  { contract: "MetaMorphoFactory", event: "CreateMetaMorpho" },
  async ({ event, context }) => {
    trackCreateLegacyVault(event, context);
    await trackLegacyVaultCreateTx(event, context);
    await updateStateOnCreateLegacyVault(event, context);
  },
);

indexer.onEvent(
  { contract: "MetaMorphoVault", event: "Deposit" },
  async ({ event, context }) => {
    trackLegacyVaultDeposit(event, context);
    await trackLegacyVaultUserDepositTx(event, context);
  },
);

indexer.onEvent(
  { contract: "MetaMorphoVault", event: "Withdraw" },
  async ({ event, context }) => {
    trackLegacyVaultWithdraw(event, context);
    await trackLegacyVaultUserWithdrawTx(event, context);
  },
);

indexer.onEvent(
  { contract: "MetaMorphoVault", event: "ReallocateSupply" },
  async ({ event, context }) => {
    trackLegacyVaultReallocateSupply(event, context);
    await trackLegacyVaultRebalanceTx(event, context);
    await trackMarketLegacyReallocateSupplyTx(event, context);
  },
);

indexer.onEvent(
  { contract: "MetaMorphoVault", event: "ReallocateWithdraw" },
  async ({ event, context }) => {
    trackLegacyVaultReallocateWithdraw(event, context);
    await trackLegacyVaultRebalanceTx(event, context);
    await trackMarketLegacyReallocateWithdrawTx(event, context);
  },
);

indexer.onEvent(
  {
    contract: "MorphoMarketV1AdapterFactory",
    event: "CreateMorphoMarketV1Adapter",
  },
  async ({ event, context }) => {
    trackCreateMorphoMarketV1Adapter(event, context);
    await updateStateOnCreateMorphoMarketV1Adapter(event, context);
  },
);

indexer.onEvent(
  {
    contract: "MorphoVaultV1AdapterFactory",
    event: "CreateMorphoVaultV1Adapter",
  },
  async ({ event, context }) => {
    trackCreateMorphoVaultV1Adapter(event, context);
    await updateStateOnCreateMorphoVaultV1Adapter(event, context);
  },
);

indexer.onEvent(
  {
    contract: "MorphoMarketV1AdapterV2Factory",
    event: "CreateMorphoMarketV1AdapterV2Factory",
  },

  async ({ event, context }) => {
    trackCreateMorphoMarketV1AdapterV2Factory(event, context);
  },
);

indexer.onEvent(
  {
    contract: "MorphoMarketV1AdapterV2Factory",
    event: "CreateMorphoMarketV1AdapterV2",
  },

  async ({ event, context }) => {
    trackCreateMorphoMarketV1AdapterV2(event, context);
    await updateStateOnCreateMorphoMarketV1AdapterV2(event, context);
  },
);

// ============================================
// VaultV2 Events
// ============================================

indexer.contractRegister(
  { contract: "VaultV2Factory", event: "CreateVaultV2" },
  async ({ event, context }) => {
    context.chain.VaultV2.add(event.params.newVaultV2);
  },
);

indexer.onEvent(
  { contract: "VaultV2Factory", event: "CreateVaultV2" },
  async ({ event, context }) => {
    trackCreateVaultV2(event, context);
    await trackVaultCreateTx(event, context);
    await updateStateOnCreateVaultV2(event, context);
  },
);

indexer.onEvent(
  { contract: "VaultV2", event: "AddAdapter" },
  async ({ event, context }) => {
    await trackVaultConfigTx(event, context);
    await updateStateOnVaultAddAdapter(event, context);
  },
);

indexer.onEvent(
  { contract: "VaultV2", event: "Allocate" },
  async ({ event, context }) => {
    trackVaultAllocate(event, context);
    await trackVaultRebalanceTx(event, context);
  },
);

indexer.onEvent(
  { contract: "VaultV2", event: "DecreaseAbsoluteCap" },
  async ({ event, context }) => {
    await trackVaultConfigTx(event, context);
    await updateStateOnVaultSetAbsoluteCap(event, context);
  },
);

indexer.onEvent(
  { contract: "VaultV2", event: "DecreaseRelativeCap" },
  async ({ event, context }) => {
    await trackVaultConfigTx(event, context);
    await updateStateOnVaultSetRelativeCap(event, context);
  },
);

indexer.onEvent(
  { contract: "VaultV2", event: "Deallocate" },
  async ({ event, context }) => {
    trackVaultDeallocate(event, context);
    await trackVaultRebalanceTx(event, context);
  },
);

indexer.onEvent(
  { contract: "VaultV2", event: "Deposit" },
  async ({ event, context }) => {
    trackVaultDeposit(event, context);
    await trackVaultUserDepositTx(event, context);
    await updateStateOnVaultDeposit(event, context);
  },
);

indexer.onEvent(
  { contract: "VaultV2", event: "ForceDeallocate" },
  async ({ event, context }) => {
    trackVaultForceDeallocate(event, context);
    await trackVaultRebalanceTx(event, context);
  },
);

indexer.onEvent(
  { contract: "VaultV2", event: "IncreaseAbsoluteCap" },
  async ({ event, context }) => {
    await trackVaultConfigTx(event, context);
    await updateStateOnVaultSetAbsoluteCap(event, context);
  },
);

indexer.onEvent(
  { contract: "VaultV2", event: "IncreaseRelativeCap" },
  async ({ event, context }) => {
    await trackVaultConfigTx(event, context);
    await updateStateOnVaultSetRelativeCap(event, context);
  },
);

indexer.onEvent(
  { contract: "VaultV2", event: "RemoveAdapter" },
  async ({ event, context }) => {
    await trackVaultConfigTx(event, context);
    await updateStateOnVaultRemoveAdapter(event, context);
  },
);

indexer.onEvent(
  { contract: "VaultV2", event: "SetAdapterRegistry" },
  async ({ event, context }) => {
    await trackVaultConfigTx(event, context);
    await updateStateOnVaultSetAdapterRegistry(event, context);
  },
);

indexer.onEvent(
  { contract: "VaultV2", event: "SetCurator" },
  async ({ event, context }) => {
    await trackVaultConfigTx(event, context);
    await updateStateOnVaultSetCurator(event, context);
  },
);

indexer.onEvent(
  { contract: "VaultV2", event: "SetForceDeallocatePenalty" },
  async ({ event, context }) => {
    await trackVaultConfigTx(event, context);
    await updateStateOnVaultSetForceDeallocatePenalty(event, context);
  },
);

indexer.onEvent(
  { contract: "VaultV2", event: "SetIsAllocator" },
  async ({ event, context }) => {
    await trackVaultConfigTx(event, context);
    await updateStateOnVaultSetIsAllocator(event, context);
  },
);

indexer.onEvent(
  { contract: "VaultV2", event: "SetIsSentinel" },
  async ({ event, context }) => {
    await trackVaultConfigTx(event, context);
    await updateStateOnVaultSetIsSentinel(event, context);
  },
);

indexer.onEvent(
  { contract: "VaultV2", event: "SetManagementFee" },
  async ({ event, context }) => {
    await trackVaultConfigTx(event, context);
    await updateStateOnVaultSetManagementFee(event, context);
  },
);

indexer.onEvent(
  { contract: "VaultV2", event: "SetManagementFeeRecipient" },
  async ({ event, context }) => {
    await trackVaultConfigTx(event, context);
    await updateStateOnVaultSetManagementFeeRecipient(event, context);
  },
);

indexer.onEvent(
  { contract: "VaultV2", event: "SetMaxRate" },
  async ({ event, context }) => {
    await trackVaultConfigTx(event, context);
    await updateStateOnVaultSetMaxRate(event, context);
  },
);

indexer.onEvent(
  { contract: "VaultV2", event: "SetName" },
  async ({ event, context }) => {
    await trackVaultConfigTx(event, context);
    await updateStateOnVaultSetName(event, context);
  },
);

indexer.onEvent(
  { contract: "VaultV2", event: "SetOwner" },
  async ({ event, context }) => {
    await trackVaultConfigTx(event, context);
    await updateStateOnVaultSetOwner(event, context);
  },
);

indexer.onEvent(
  { contract: "VaultV2", event: "SetPerformanceFee" },
  async ({ event, context }) => {
    await trackVaultConfigTx(event, context);
    await updateStateOnVaultSetPerformanceFee(event, context);
  },
);

indexer.onEvent(
  { contract: "VaultV2", event: "SetPerformanceFeeRecipient" },
  async ({ event, context }) => {
    await trackVaultConfigTx(event, context);
    await updateStateOnVaultSetPerformanceFeeRecipient(event, context);
  },
);

indexer.onEvent(
  { contract: "VaultV2", event: "SetReceiveAssetsGate" },
  async ({ event, context }) => {
    await trackVaultConfigTx(event, context);
    await updateStateOnVaultSetReceiveAssetsGate(event, context);
  },
);

indexer.onEvent(
  { contract: "VaultV2", event: "SetReceiveSharesGate" },
  async ({ event, context }) => {
    await trackVaultConfigTx(event, context);
    await updateStateOnVaultSetReceiveSharesGate(event, context);
  },
);

indexer.onEvent(
  { contract: "VaultV2", event: "SetSendAssetsGate" },
  async ({ event, context }) => {
    await trackVaultConfigTx(event, context);
    await updateStateOnVaultSetSendAssetsGate(event, context);
  },
);

indexer.onEvent(
  { contract: "VaultV2", event: "SetSendSharesGate" },
  async ({ event, context }) => {
    await trackVaultConfigTx(event, context);
    await updateStateOnVaultSetSendSharesGate(event, context);
  },
);

indexer.onEvent(
  { contract: "VaultV2", event: "SetSymbol" },
  async ({ event, context }) => {
    await trackVaultConfigTx(event, context);
    await updateStateOnVaultSetSymbol(event, context);
  },
);

indexer.onEvent(
  { contract: "VaultV2", event: "Withdraw" },
  async ({ event, context }) => {
    trackVaultWithdraw(event, context);
    await trackVaultUserWithdrawTx(event, context);
    await updateStateOnVaultWithdraw(event, context);
  },
);
