/**
 * Event Tracking - Raw event entity storage
 * Each function creates and stores a raw event entity for historical tracking.
 */
import type {
  Morpho_AccrueInterest,
  Morpho_Borrow,
  Morpho_CreateMarket,
  Morpho_EnableIrm,
  Morpho_EnableLltv,
  Morpho_FlashLoan,
  Morpho_IncrementNonce,
  Morpho_Liquidate,
  Morpho_Repay,
  Morpho_SetAuthorization,
  Morpho_SetFee,
  Morpho_SetFeeRecipient,
  Morpho_SetOwner,
  Morpho_Supply,
  Morpho_SupplyCollateral,
  Morpho_Withdraw,
  Morpho_WithdrawCollateral,
  AdaptiveCurveIrm_BorrowRateUpdate,
} from "generated";

type EventContext = {
  Morpho_AccrueInterest: { set: (entity: Morpho_AccrueInterest) => void };
  Morpho_Borrow: { set: (entity: Morpho_Borrow) => void };
  Morpho_CreateMarket: { set: (entity: Morpho_CreateMarket) => void };
  Morpho_EnableIrm: { set: (entity: Morpho_EnableIrm) => void };
  Morpho_EnableLltv: { set: (entity: Morpho_EnableLltv) => void };
  Morpho_FlashLoan: { set: (entity: Morpho_FlashLoan) => void };
  Morpho_IncrementNonce: { set: (entity: Morpho_IncrementNonce) => void };
  Morpho_Liquidate: { set: (entity: Morpho_Liquidate) => void };
  Morpho_Repay: { set: (entity: Morpho_Repay) => void };
  Morpho_SetAuthorization: { set: (entity: Morpho_SetAuthorization) => void };
  Morpho_SetFee: { set: (entity: Morpho_SetFee) => void };
  Morpho_SetFeeRecipient: { set: (entity: Morpho_SetFeeRecipient) => void };
  Morpho_SetOwner: { set: (entity: Morpho_SetOwner) => void };
  Morpho_Supply: { set: (entity: Morpho_Supply) => void };
  Morpho_SupplyCollateral: { set: (entity: Morpho_SupplyCollateral) => void };
  Morpho_Withdraw: { set: (entity: Morpho_Withdraw) => void };
  Morpho_WithdrawCollateral: { set: (entity: Morpho_WithdrawCollateral) => void };
  AdaptiveCurveIrm_BorrowRateUpdate: { set: (entity: AdaptiveCurveIrm_BorrowRateUpdate) => void };
};

// Helper to generate unique event ID
const eventId = (chainId: number, blockNumber: number, logIndex: number) =>
  `${chainId}_${blockNumber}_${logIndex}`;

// Helper to detect Monarch frontend transactions (batched rebalance)
const isMonarchTx = (input: string | undefined): boolean => {
  if (!input) return false;
  return input.toLowerCase().endsWith("beef");
};

export function trackAccrueInterest(
  event: {
    chainId: number;
    block: { number: number; timestamp: number };
    logIndex: number;
    transaction: { hash: string };
    params: { id: string; prevBorrowRate: bigint; interest: bigint; feeShares: bigint };
  },
  context: EventContext
) {
  const entity: Morpho_AccrueInterest = {
    id: eventId(event.chainId, event.block.number, event.logIndex),
    market_id: event.params.id,
    prevBorrowRate: event.params.prevBorrowRate,
    interest: event.params.interest,
    feeShares: event.params.feeShares,
    timestamp: BigInt(event.block.timestamp),
    chainId: event.chainId,
    txHash: event.transaction.hash,
  };
  context.Morpho_AccrueInterest.set(entity);
}

export function trackBorrow(
  event: {
    chainId: number;
    block: { number: number; timestamp: number };
    logIndex: number;
    transaction: { hash: string; input?: string };
    params: { id: string; caller: string; onBehalf: string; receiver: string; assets: bigint; shares: bigint };
  },
  context: EventContext
) {
  const entity: Morpho_Borrow = {
    id: eventId(event.chainId, event.block.number, event.logIndex),
    market_id: event.params.id,
    caller: event.params.caller,
    onBehalf: event.params.onBehalf,
    receiver: event.params.receiver,
    assets: event.params.assets,
    shares: event.params.shares,
    timestamp: BigInt(event.block.timestamp),
    chainId: event.chainId,
    txHash: event.transaction.hash,
    isMonarch: isMonarchTx(event.transaction.input),
  };
  context.Morpho_Borrow.set(entity);
}

export function trackCreateMarket(
  event: {
    chainId: number;
    block: { number: number; timestamp: number };
    logIndex: number;
    transaction: { hash: string };
    params: { id: string; marketParams: readonly [string, string, string, string, bigint] };
  },
  context: EventContext
) {
  const entity: Morpho_CreateMarket = {
    id: eventId(event.chainId, event.block.number, event.logIndex),
    market_id: event.params.id,
    marketParams_0: event.params.marketParams[0],
    marketParams_1: event.params.marketParams[1],
    marketParams_2: event.params.marketParams[2],
    marketParams_3: event.params.marketParams[3],
    marketParams_4: event.params.marketParams[4],
    timestamp: BigInt(event.block.timestamp),
    chainId: event.chainId,
    txHash: event.transaction.hash,
  };
  context.Morpho_CreateMarket.set(entity);
}

export function trackEnableIrm(
  event: {
    chainId: number;
    block: { number: number; timestamp: number };
    logIndex: number;
    transaction: { hash: string };
    params: { irm: string };
  },
  context: EventContext
) {
  const entity: Morpho_EnableIrm = {
    id: eventId(event.chainId, event.block.number, event.logIndex),
    irm: event.params.irm,
    timestamp: BigInt(event.block.timestamp),
    chainId: event.chainId,
    txHash: event.transaction.hash,
  };
  context.Morpho_EnableIrm.set(entity);
}

export function trackEnableLltv(
  event: {
    chainId: number;
    block: { number: number; timestamp: number };
    logIndex: number;
    transaction: { hash: string };
    params: { lltv: bigint };
  },
  context: EventContext
) {
  const entity: Morpho_EnableLltv = {
    id: eventId(event.chainId, event.block.number, event.logIndex),
    lltv: event.params.lltv,
    timestamp: BigInt(event.block.timestamp),
    chainId: event.chainId,
    txHash: event.transaction.hash,
  };
  context.Morpho_EnableLltv.set(entity);
}

export function trackFlashLoan(
  event: {
    chainId: number;
    block: { number: number; timestamp: number };
    logIndex: number;
    transaction: { hash: string };
    params: { caller: string; token: string; assets: bigint };
  },
  context: EventContext
) {
  const entity: Morpho_FlashLoan = {
    id: eventId(event.chainId, event.block.number, event.logIndex),
    caller: event.params.caller,
    token: event.params.token,
    assets: event.params.assets,
    timestamp: BigInt(event.block.timestamp),
    chainId: event.chainId,
    txHash: event.transaction.hash,
  };
  context.Morpho_FlashLoan.set(entity);
}

export function trackIncrementNonce(
  event: {
    chainId: number;
    block: { number: number; timestamp: number };
    logIndex: number;
    transaction: { hash: string };
    params: { caller: string; authorizer: string; usedNonce: bigint };
  },
  context: EventContext
) {
  const entity: Morpho_IncrementNonce = {
    id: eventId(event.chainId, event.block.number, event.logIndex),
    caller: event.params.caller,
    authorizer: event.params.authorizer,
    usedNonce: event.params.usedNonce,
    timestamp: BigInt(event.block.timestamp),
    chainId: event.chainId,
    txHash: event.transaction.hash,
  };
  context.Morpho_IncrementNonce.set(entity);
}

export function trackLiquidate(
  event: {
    chainId: number;
    block: { number: number; timestamp: number };
    logIndex: number;
    transaction: { hash: string; input?: string };
    params: {
      id: string;
      caller: string;
      borrower: string;
      repaidAssets: bigint;
      repaidShares: bigint;
      seizedAssets: bigint;
      badDebtAssets: bigint;
      badDebtShares: bigint;
    };
  },
  context: EventContext
) {
  const entity: Morpho_Liquidate = {
    id: eventId(event.chainId, event.block.number, event.logIndex),
    market_id: event.params.id,
    caller: event.params.caller,
    borrower: event.params.borrower,
    repaidAssets: event.params.repaidAssets,
    repaidShares: event.params.repaidShares,
    seizedAssets: event.params.seizedAssets,
    badDebtAssets: event.params.badDebtAssets,
    badDebtShares: event.params.badDebtShares,
    timestamp: BigInt(event.block.timestamp),
    chainId: event.chainId,
    txHash: event.transaction.hash,
    isMonarch: isMonarchTx(event.transaction.input),
  };
  context.Morpho_Liquidate.set(entity);
}

export function trackRepay(
  event: {
    chainId: number;
    block: { number: number; timestamp: number };
    logIndex: number;
    transaction: { hash: string };
    params: { id: string; caller: string; onBehalf: string; assets: bigint; shares: bigint };
  },
  context: EventContext
) {
  const entity: Morpho_Repay = {
    id: eventId(event.chainId, event.block.number, event.logIndex),
    market_id: event.params.id,
    caller: event.params.caller,
    onBehalf: event.params.onBehalf,
    assets: event.params.assets,
    shares: event.params.shares,
    timestamp: BigInt(event.block.timestamp),
    chainId: event.chainId,
    txHash: event.transaction.hash,
  };
  context.Morpho_Repay.set(entity);
}

export function trackSetAuthorization(
  event: {
    chainId: number;
    block: { number: number; timestamp: number };
    logIndex: number;
    transaction: { hash: string };
    params: { caller: string; authorizer: string; authorized: string; newIsAuthorized: boolean };
  },
  context: EventContext
) {
  const entity: Morpho_SetAuthorization = {
    id: eventId(event.chainId, event.block.number, event.logIndex),
    caller: event.params.caller,
    authorizer: event.params.authorizer,
    authorized: event.params.authorized,
    newIsAuthorized: event.params.newIsAuthorized,
    timestamp: BigInt(event.block.timestamp),
    chainId: event.chainId,
    txHash: event.transaction.hash,
  };
  context.Morpho_SetAuthorization.set(entity);
}

export function trackSetFee(
  event: {
    chainId: number;
    block: { number: number; timestamp: number };
    logIndex: number;
    transaction: { hash: string };
    params: { id: string; newFee: bigint };
  },
  context: EventContext
) {
  const entity: Morpho_SetFee = {
    id: eventId(event.chainId, event.block.number, event.logIndex),
    market_id: event.params.id,
    newFee: event.params.newFee,
    timestamp: BigInt(event.block.timestamp),
    chainId: event.chainId,
    txHash: event.transaction.hash,
  };
  context.Morpho_SetFee.set(entity);
}

export function trackSetFeeRecipient(
  event: {
    chainId: number;
    block: { number: number; timestamp: number };
    logIndex: number;
    transaction: { hash: string };
    params: { newFeeRecipient: string };
  },
  context: EventContext
) {
  const entity: Morpho_SetFeeRecipient = {
    id: eventId(event.chainId, event.block.number, event.logIndex),
    newFeeRecipient: event.params.newFeeRecipient,
    timestamp: BigInt(event.block.timestamp),
    chainId: event.chainId,
    txHash: event.transaction.hash,
  };
  context.Morpho_SetFeeRecipient.set(entity);
}

export function trackSetOwner(
  event: {
    chainId: number;
    block: { number: number; timestamp: number };
    logIndex: number;
    transaction: { hash: string };
    params: { newOwner: string };
  },
  context: EventContext
) {
  const entity: Morpho_SetOwner = {
    id: eventId(event.chainId, event.block.number, event.logIndex),
    newOwner: event.params.newOwner,
    timestamp: BigInt(event.block.timestamp),
    chainId: event.chainId,
    txHash: event.transaction.hash,
  };
  context.Morpho_SetOwner.set(entity);
}

export function trackSupply(
  event: {
    chainId: number;
    block: { number: number; timestamp: number };
    logIndex: number;
    transaction: { hash: string; input?: string };
    params: { id: string; caller: string; onBehalf: string; assets: bigint; shares: bigint };
  },
  context: EventContext
) {
  const entity: Morpho_Supply = {
    id: eventId(event.chainId, event.block.number, event.logIndex),
    market_id: event.params.id,
    caller: event.params.caller,
    onBehalf: event.params.onBehalf,
    assets: event.params.assets,
    shares: event.params.shares,
    timestamp: BigInt(event.block.timestamp),
    chainId: event.chainId,
    txHash: event.transaction.hash,
    isMonarch: isMonarchTx(event.transaction.input),
  };
  context.Morpho_Supply.set(entity);
}

export function trackSupplyCollateral(
  event: {
    chainId: number;
    block: { number: number; timestamp: number };
    logIndex: number;
    transaction: { hash: string; input?: string };
    params: { id: string; caller: string; onBehalf: string; assets: bigint };
  },
  context: EventContext
) {
  const entity: Morpho_SupplyCollateral = {
    id: eventId(event.chainId, event.block.number, event.logIndex),
    market_id: event.params.id,
    caller: event.params.caller,
    onBehalf: event.params.onBehalf,
    assets: event.params.assets,
    timestamp: BigInt(event.block.timestamp),
    chainId: event.chainId,
    txHash: event.transaction.hash,
    isMonarch: isMonarchTx(event.transaction.input),
  };
  context.Morpho_SupplyCollateral.set(entity);
}

export function trackWithdraw(
  event: {
    chainId: number;
    block: { number: number; timestamp: number };
    logIndex: number;
    transaction: { hash: string; input?: string };
    params: { id: string; caller: string; onBehalf: string; receiver: string; assets: bigint; shares: bigint };
  },
  context: EventContext
) {
  const entity: Morpho_Withdraw = {
    id: eventId(event.chainId, event.block.number, event.logIndex),
    market_id: event.params.id,
    caller: event.params.caller,
    onBehalf: event.params.onBehalf,
    receiver: event.params.receiver,
    assets: event.params.assets,
    shares: event.params.shares,
    timestamp: BigInt(event.block.timestamp),
    chainId: event.chainId,
    txHash: event.transaction.hash,
    isMonarch: isMonarchTx(event.transaction.input),
  };
  context.Morpho_Withdraw.set(entity);
}

export function trackWithdrawCollateral(
  event: {
    chainId: number;
    block: { number: number; timestamp: number };
    logIndex: number;
    transaction: { hash: string; input?: string };
    params: { id: string; caller: string; onBehalf: string; receiver: string; assets: bigint };
  },
  context: EventContext
) {
  const entity: Morpho_WithdrawCollateral = {
    id: eventId(event.chainId, event.block.number, event.logIndex),
    market_id: event.params.id,
    caller: event.params.caller,
    onBehalf: event.params.onBehalf,
    receiver: event.params.receiver,
    assets: event.params.assets,
    timestamp: BigInt(event.block.timestamp),
    chainId: event.chainId,
    txHash: event.transaction.hash,
    isMonarch: isMonarchTx(event.transaction.input),
  };
  context.Morpho_WithdrawCollateral.set(entity);
}

// ============================================
// AdaptiveCurveIrm Events
// ============================================

export function trackBorrowRateUpdate(
  event: {
    chainId: number;
    block: { number: number; timestamp: number };
    logIndex: number;
    transaction: { hash: string };
    params: { id: string; avgBorrowRate: bigint; rateAtTarget: bigint };
  },
  context: EventContext
) {
  const entity: AdaptiveCurveIrm_BorrowRateUpdate = {
    id: eventId(event.chainId, event.block.number, event.logIndex),
    market_id: event.params.id,
    avgBorrowRate: event.params.avgBorrowRate,
    rateAtTarget: event.params.rateAtTarget,
    timestamp: BigInt(event.block.timestamp),
    chainId: event.chainId,
    txHash: event.transaction.hash,
  };
  context.AdaptiveCurveIrm_BorrowRateUpdate.set(entity);
}
