import type { MarketTxContext, TxContext } from "generated";
import { marketTxContextId, normalizeHash, txContextId } from "./ids";

type TxTrackingContext = {
  TxContext: {
    get: (id: string) => Promise<TxContext | undefined>;
    set: (entity: TxContext) => void;
  };
};

type MarketTxTrackingContext = {
  MarketTxContext: {
    get: (id: string) => Promise<MarketTxContext | undefined>;
    set: (entity: MarketTxContext) => void;
  };
};

type BaseTxEvent = {
  chainId: number;
  block: { timestamp: number };
  transaction: { hash: string };
};

type BaseVaultTxEvent = BaseTxEvent & {
  srcAddress: string;
};

type BaseMarketTxEvent = {
  chainId: number;
  block: { number: number; timestamp: number };
  transaction: { hash: string; transactionIndex: number };
  params: { id: string };
};

type TxFlags = Pick<
  TxContext,
  | "hasMorphoBlueEvent"
  | "hasVaultV2Event"
  | "hasLegacyVaultEvent"
  | "hasVaultUserDeposit"
  | "hasVaultUserWithdraw"
  | "hasVaultRebalance"
  | "hasVaultConfigChange"
>;

type MarketTxFlags = Pick<
  MarketTxContext,
  | "hasSupply"
  | "hasWithdraw"
  | "hasBorrow"
  | "hasRepay"
  | "hasSupplyCollateral"
  | "hasWithdrawCollateral"
  | "hasLegacyReallocateSupply"
  | "hasLegacyReallocateWithdraw"
>;

const defaultTxFlags = (): TxFlags => ({
  hasMorphoBlueEvent: false,
  hasVaultV2Event: false,
  hasLegacyVaultEvent: false,
  hasVaultUserDeposit: false,
  hasVaultUserWithdraw: false,
  hasVaultRebalance: false,
  hasVaultConfigChange: false,
});

const defaultMarketTxFlags = (): MarketTxFlags => ({
  hasSupply: false,
  hasWithdraw: false,
  hasBorrow: false,
  hasRepay: false,
  hasSupplyCollateral: false,
  hasWithdrawCollateral: false,
  hasLegacyReallocateSupply: false,
  hasLegacyReallocateWithdraw: false,
});

const countTrue = (values: boolean[]) => values.filter(Boolean).length;

export function resolveVaultTxType(flags: TxFlags): string {
  const categories = [
    flags.hasVaultUserDeposit,
    flags.hasVaultUserWithdraw,
    flags.hasVaultRebalance,
    flags.hasVaultConfigChange,
  ];

  if (countTrue(categories) === 0) return "none";
  if (countTrue(categories) > 1) return "mixed";
  if (flags.hasVaultUserDeposit) return "user_deposit";
  if (flags.hasVaultUserWithdraw) return "user_withdraw";
  if (flags.hasVaultRebalance) return "rebalance";
  return "config";
}

function resolveMarketFlowFlags(flags: MarketTxFlags) {
  return {
    hasLoanFlow:
      flags.hasSupply ||
      flags.hasWithdraw ||
      flags.hasBorrow ||
      flags.hasRepay ||
      flags.hasLegacyReallocateSupply ||
      flags.hasLegacyReallocateWithdraw,
    hasCollateralFlow: flags.hasSupplyCollateral || flags.hasWithdrawCollateral,
  };
}

async function getOrCreateTxContext(
  context: TxTrackingContext,
  chainId: number,
  txHash: string,
  timestamp: number
): Promise<TxContext> {
  const id = txContextId(chainId, txHash);
  const existing = await context.TxContext.get(id);

  if (existing) {
    return existing;
  }

  return {
    id,
    chainId,
    txHash: normalizeHash(txHash),
    timestamp: BigInt(timestamp),
    ...defaultTxFlags(),
    vaultTxType: "none",
  };
}

async function getOrCreateMarketTxContext(
  context: MarketTxTrackingContext,
  event: BaseMarketTxEvent
): Promise<MarketTxContext> {
  const nextTxContextId = txContextId(event.chainId, event.transaction.hash);
  const id = marketTxContextId(event.chainId, event.params.id, nextTxContextId);
  const existing = await context.MarketTxContext.get(id);

  if (existing) {
    return existing;
  }

  return {
    id,
    chainId: event.chainId,
    market_id: event.params.id,
    txContext_id: nextTxContextId,
    txHash: normalizeHash(event.transaction.hash),
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    transactionIndex: event.transaction.transactionIndex,
    ...defaultMarketTxFlags(),
    hasLoanFlow: false,
    hasCollateralFlow: false,
  };
}

async function updateTxContext(
  context: TxTrackingContext,
  event: BaseTxEvent,
  updates: Partial<TxFlags>
) {
  const entity = await getOrCreateTxContext(
    context,
    event.chainId,
    event.transaction.hash,
    event.block.timestamp
  );

  const nextFlags: TxFlags = {
    hasMorphoBlueEvent: entity.hasMorphoBlueEvent || !!updates.hasMorphoBlueEvent,
    hasVaultV2Event: entity.hasVaultV2Event || !!updates.hasVaultV2Event,
    hasLegacyVaultEvent: entity.hasLegacyVaultEvent || !!updates.hasLegacyVaultEvent,
    hasVaultUserDeposit: entity.hasVaultUserDeposit || !!updates.hasVaultUserDeposit,
    hasVaultUserWithdraw: entity.hasVaultUserWithdraw || !!updates.hasVaultUserWithdraw,
    hasVaultRebalance: entity.hasVaultRebalance || !!updates.hasVaultRebalance,
    hasVaultConfigChange: entity.hasVaultConfigChange || !!updates.hasVaultConfigChange,
  };

  context.TxContext.set({
    ...entity,
    ...nextFlags,
    timestamp: BigInt(event.block.timestamp),
    vaultTxType: resolveVaultTxType(nextFlags),
  });
}

async function updateMarketTxContext(
  context: MarketTxTrackingContext,
  event: BaseMarketTxEvent,
  updates: Partial<MarketTxFlags>
) {
  const entity = await getOrCreateMarketTxContext(context, event);

  const nextFlags: MarketTxFlags = {
    hasSupply: entity.hasSupply || !!updates.hasSupply,
    hasWithdraw: entity.hasWithdraw || !!updates.hasWithdraw,
    hasBorrow: entity.hasBorrow || !!updates.hasBorrow,
    hasRepay: entity.hasRepay || !!updates.hasRepay,
    hasSupplyCollateral: entity.hasSupplyCollateral || !!updates.hasSupplyCollateral,
    hasWithdrawCollateral: entity.hasWithdrawCollateral || !!updates.hasWithdrawCollateral,
    hasLegacyReallocateSupply:
      entity.hasLegacyReallocateSupply || !!updates.hasLegacyReallocateSupply,
    hasLegacyReallocateWithdraw:
      entity.hasLegacyReallocateWithdraw || !!updates.hasLegacyReallocateWithdraw,
  };

  context.MarketTxContext.set({
    ...entity,
    ...nextFlags,
    txHash: normalizeHash(event.transaction.hash),
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    transactionIndex: event.transaction.transactionIndex,
    ...resolveMarketFlowFlags(nextFlags),
  });
}

export async function trackMorphoBlueTx(event: BaseTxEvent, context: TxTrackingContext) {
  await updateTxContext(context, event, { hasMorphoBlueEvent: true });
}

export async function trackMarketBorrowTx(
  event: BaseMarketTxEvent,
  context: MarketTxTrackingContext
) {
  await updateMarketTxContext(context, event, { hasBorrow: true });
}

export async function trackMarketRepayTx(
  event: BaseMarketTxEvent,
  context: MarketTxTrackingContext
) {
  await updateMarketTxContext(context, event, { hasRepay: true });
}

export async function trackMarketSupplyTx(
  event: BaseMarketTxEvent,
  context: MarketTxTrackingContext
) {
  await updateMarketTxContext(context, event, { hasSupply: true });
}

export async function trackMarketSupplyCollateralTx(
  event: BaseMarketTxEvent,
  context: MarketTxTrackingContext
) {
  await updateMarketTxContext(context, event, { hasSupplyCollateral: true });
}

export async function trackMarketWithdrawTx(
  event: BaseMarketTxEvent,
  context: MarketTxTrackingContext
) {
  await updateMarketTxContext(context, event, { hasWithdraw: true });
}

export async function trackMarketWithdrawCollateralTx(
  event: BaseMarketTxEvent,
  context: MarketTxTrackingContext
) {
  await updateMarketTxContext(context, event, { hasWithdrawCollateral: true });
}

export async function trackVaultUserDepositTx(event: BaseVaultTxEvent, context: TxTrackingContext) {
  await updateTxContext(context, event, {
    hasVaultV2Event: true,
    hasVaultUserDeposit: true,
  });
}

export async function trackVaultUserWithdrawTx(
  event: BaseVaultTxEvent,
  context: TxTrackingContext
) {
  await updateTxContext(context, event, {
    hasVaultV2Event: true,
    hasVaultUserWithdraw: true,
  });
}

export async function trackVaultRebalanceTx(
  event: BaseVaultTxEvent,
  context: TxTrackingContext
) {
  await updateTxContext(context, event, {
    hasVaultV2Event: true,
    hasVaultRebalance: true,
  });
}

export async function trackVaultConfigTx(event: BaseVaultTxEvent, context: TxTrackingContext) {
  await updateTxContext(context, event, {
    hasVaultV2Event: true,
    hasVaultConfigChange: true,
  });
}

export async function trackVaultCreateTx(event: BaseTxEvent, context: TxTrackingContext) {
  await updateTxContext(context, event, {
    hasVaultV2Event: true,
    hasVaultConfigChange: true,
  });
}

export async function trackLegacyVaultCreateTx(
  event: BaseTxEvent,
  context: TxTrackingContext
) {
  await updateTxContext(context, event, {
    hasLegacyVaultEvent: true,
    hasVaultConfigChange: true,
  });
}

export async function trackLegacyVaultUserDepositTx(
  event: BaseVaultTxEvent,
  context: TxTrackingContext
) {
  await updateTxContext(context, event, {
    hasLegacyVaultEvent: true,
    hasVaultUserDeposit: true,
  });
}

export async function trackLegacyVaultUserWithdrawTx(
  event: BaseVaultTxEvent,
  context: TxTrackingContext
) {
  await updateTxContext(context, event, {
    hasLegacyVaultEvent: true,
    hasVaultUserWithdraw: true,
  });
}

export async function trackLegacyVaultRebalanceTx(
  event: BaseVaultTxEvent,
  context: TxTrackingContext
) {
  await updateTxContext(context, event, {
    hasLegacyVaultEvent: true,
    hasVaultRebalance: true,
  });
}

export async function trackMarketLegacyReallocateSupplyTx(
  event: BaseMarketTxEvent,
  context: MarketTxTrackingContext
) {
  await updateMarketTxContext(context, event, { hasLegacyReallocateSupply: true });
}

export async function trackMarketLegacyReallocateWithdrawTx(
  event: BaseMarketTxEvent,
  context: MarketTxTrackingContext
) {
  await updateMarketTxContext(context, event, { hasLegacyReallocateWithdraw: true });
}
