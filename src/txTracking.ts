import type { TxContext } from "generated";
import { normalizeHash, txContextId } from "./ids";

type TxTrackingContext = {
  TxContext: {
    get: (id: string) => Promise<TxContext | undefined>;
    set: (entity: TxContext) => void;
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

type TxFlags = Pick<
  TxContext,
  | "hasMorphoBlueEvent"
  | "hasVaultV2Event"
  | "hasVaultUserDeposit"
  | "hasVaultUserWithdraw"
  | "hasVaultRebalance"
  | "hasVaultConfigChange"
>;

const defaultTxFlags = (): TxFlags => ({
  hasMorphoBlueEvent: false,
  hasVaultV2Event: false,
  hasVaultUserDeposit: false,
  hasVaultUserWithdraw: false,
  hasVaultRebalance: false,
  hasVaultConfigChange: false,
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

export async function trackMorphoBlueTx(event: BaseTxEvent, context: TxTrackingContext) {
  await updateTxContext(context, event, { hasMorphoBlueEvent: true });
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
