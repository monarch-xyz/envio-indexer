/**
 * State Tracking - Track protocol state (Market, Position, Authorization)
 * Logic translated from Ponder indexer.
 */
import type {
  Market,
  Position,
  Authorization,
  Adapter,
  Vault,
  VaultAllocator,
  VaultSentinel,
  VaultAdapter,
  VaultCap,
} from "generated";
import {
  adapterId,
  authorizationId,
  marketId,
  normalizeAddress,
  positionId,
  vaultAdapterId,
  vaultCapId,
  vaultId,
  vaultRoleId,
} from "./ids";

type StateContext = {
  Market: {
    get: (id: string) => Promise<Market | undefined>;
    set: (entity: Market) => void;
  };
  Position: {
    get: (id: string) => Promise<Position | undefined>;
    set: (entity: Position) => void;
  };
  Authorization: {
    get: (id: string) => Promise<Authorization | undefined>;
    set: (entity: Authorization) => void;
  };
  Adapter: {
    get: (id: string) => Promise<Adapter | undefined>;
    set: (entity: Adapter) => void;
  };
  Vault: {
    get: (id: string) => Promise<Vault | undefined>;
    set: (entity: Vault) => void;
  };
  VaultAllocator: {
    get: (id: string) => Promise<VaultAllocator | undefined>;
    set: (entity: VaultAllocator) => void;
  };
  VaultSentinel: {
    get: (id: string) => Promise<VaultSentinel | undefined>;
    set: (entity: VaultSentinel) => void;
  };
  VaultAdapter: {
    get: (id: string) => Promise<VaultAdapter | undefined>;
    set: (entity: VaultAdapter) => void;
  };
  VaultCap: {
    get: (id: string) => Promise<VaultCap | undefined>;
    set: (entity: VaultCap) => void;
  };
};

// ============================================
// Position Helper - Get or Create
// ============================================

async function getOrCreatePosition(
  context: StateContext,
  chainId: number,
  marketIdStr: string,
  user: string
): Promise<Position> {
  const id = positionId(chainId, marketIdStr, user);
  const existing = await context.Position.get(id);

  if (existing) {
    return existing;
  }

  // Create new position with defaults
  return {
    id,
    chainId,
    marketId: marketIdStr,
    user: user.toLowerCase(),
    supplyShares: 0n,
    borrowShares: 0n,
    collateral: 0n,
    market_id: marketId(chainId, marketIdStr),
  };
}

async function getOrCreateVaultAllocator(
  context: StateContext,
  chainId: number,
  vaultAddress: string,
  account: string
): Promise<VaultAllocator> {
  const id = vaultRoleId(chainId, vaultAddress, account);
  const existing = await context.VaultAllocator.get(id);

  if (existing) {
    return existing;
  }

  return {
    id,
    vault_id: vaultId(chainId, vaultAddress),
    chainId,
    vaultAddress: normalizeAddress(vaultAddress),
    account: normalizeAddress(account),
    isAllocator: false,
  };
}

async function getOrCreateVaultSentinel(
  context: StateContext,
  chainId: number,
  vaultAddress: string,
  account: string
): Promise<VaultSentinel> {
  const id = vaultRoleId(chainId, vaultAddress, account);
  const existing = await context.VaultSentinel.get(id);

  if (existing) {
    return existing;
  }

  return {
    id,
    vault_id: vaultId(chainId, vaultAddress),
    chainId,
    vaultAddress: normalizeAddress(vaultAddress),
    account: normalizeAddress(account),
    isSentinel: false,
  };
}

async function getOrCreateVaultAdapter(
  context: StateContext,
  chainId: number,
  vaultAddress: string,
  adapter: string
): Promise<VaultAdapter> {
  const id = vaultAdapterId(chainId, vaultAddress, adapter);
  const existing = await context.VaultAdapter.get(id);

  if (existing) {
    return existing;
  }

  return {
    id,
    vault_id: vaultId(chainId, vaultAddress),
    chainId,
    vaultAddress: normalizeAddress(vaultAddress),
    adapterAddress: normalizeAddress(adapter),
    isActive: false,
    forceDeallocatePenalty: 0n,
  };
}

async function getOrCreateVaultCap(
  context: StateContext,
  chainId: number,
  vaultAddress: string,
  paramId: string,
  paramIdData: string,
  timestamp: number
): Promise<VaultCap> {
  const id = vaultCapId(chainId, vaultAddress, paramId);
  const existing = await context.VaultCap.get(id);

  if (existing) {
    return existing;
  }

  return {
    id,
    vault_id: vaultId(chainId, vaultAddress),
    chainId,
    vaultAddress: normalizeAddress(vaultAddress),
    paramId: paramId.toLowerCase(),
    paramIdData,
    absoluteCap: 0n,
    relativeCap: 0n,
    lastUpdate: BigInt(timestamp),
  };
}

type KnownAdapterType = "MorphoMarketV1Adapter" | "MorphoMarketV1AdapterV2";

async function upsertKnownAdapter(
  context: StateContext,
  params: {
    chainId: number;
    vaultAddress: string;
    adapterAddress: string;
    adapterType: KnownAdapterType;
    factoryAddress: string;
    timestamp: number;
    txHash: string;
    morphoAddress?: string;
  }
) {
  const id = adapterId(params.chainId, params.adapterAddress);
  const existing = await context.Adapter.get(id);

  context.Adapter.set({
    id,
    vault_id: vaultId(params.chainId, params.vaultAddress),
    chainId: params.chainId,
    vaultAddress: normalizeAddress(params.vaultAddress),
    adapterAddress: normalizeAddress(params.adapterAddress),
    adapterType: params.adapterType,
    factoryAddress: normalizeAddress(params.factoryAddress),
    morphoAddress: params.morphoAddress
      ? normalizeAddress(params.morphoAddress)
      : existing?.morphoAddress,
    createdAt: existing?.createdAt ?? BigInt(params.timestamp),
    txHash: existing?.txHash ?? params.txHash,
  });
}

// ============================================
// State Update Functions
// ============================================

/**
 * CreateMarket - Creates a new Market entity
 */
export async function updateStateOnCreateMarket(
  event: {
    chainId: number;
    block: { timestamp: number };
    params: {
      id: string;
      marketParams: readonly [string, string, string, string, bigint];
    };
  },
  context: StateContext
) {
  const market: Market = {
    id: marketId(event.chainId, event.params.id),
    chainId: event.chainId,
    marketId: event.params.id,
    // MarketParams
    loanToken: event.params.marketParams[0],
    collateralToken: event.params.marketParams[1],
    oracle: event.params.marketParams[2],
    irm: event.params.marketParams[3],
    lltv: event.params.marketParams[4],
    // Market state (defaults)
    totalSupplyAssets: 0n,
    totalSupplyShares: 0n,
    totalBorrowAssets: 0n,
    totalBorrowShares: 0n,
    accruedBadDebtAssets: 0n,
    accruedBadDebtShares: 0n,
    collateralAssets: 0n,
    lastUpdate: BigInt(event.block.timestamp),
    fee: 0n,
    // AdaptiveCurveIrm state
    rateAtTarget: 0n,
  };

  context.Market.set(market);
}

/**
 * SetFee - Updates Market.fee
 */
export async function updateStateOnSetFee(
  event: {
    chainId: number;
    block: { timestamp: number };
    params: { id: string; newFee: bigint };
  },
  context: StateContext
) {
  const id = marketId(event.chainId, event.params.id);
  const market = await context.Market.get(id);

  if (market) {
    context.Market.set({
      ...market,
      fee: event.params.newFee,
      lastUpdate: BigInt(event.block.timestamp),
    });
  }
}

/**
 * AccrueInterest - Updates Market totals
 */
export async function updateStateOnAccrueInterest(
  event: {
    chainId: number;
    block: { timestamp: number };
    params: { id: string; interest: bigint; feeShares: bigint };
  },
  context: StateContext
) {
  const id = marketId(event.chainId, event.params.id);
  const market = await context.Market.get(id);

  if (market) {
    context.Market.set({
      ...market,
      totalSupplyAssets: market.totalSupplyAssets + event.params.interest,
      totalSupplyShares: market.totalSupplyShares + event.params.feeShares,
      totalBorrowAssets: market.totalBorrowAssets + event.params.interest,
      lastUpdate: BigInt(event.block.timestamp),
    });
  }
}

/**
 * Supply - Updates Market totals + Position supplyShares
 */
export async function updateStateOnSupply(
  event: {
    chainId: number;
    block: { timestamp: number };
    params: { id: string; onBehalf: string; assets: bigint; shares: bigint };
  },
  context: StateContext
) {
  const mktId = marketId(event.chainId, event.params.id);

  // Update Market
  const market = await context.Market.get(mktId);
  if (market) {
    context.Market.set({
      ...market,
      totalSupplyAssets: market.totalSupplyAssets + event.params.assets,
      totalSupplyShares: market.totalSupplyShares + event.params.shares,
      lastUpdate: BigInt(event.block.timestamp),
    });
  }

  // Upsert Position
  const position = await getOrCreatePosition(
    context,
    event.chainId,
    event.params.id,
    event.params.onBehalf
  );
  context.Position.set({
    ...position,
    supplyShares: position.supplyShares + event.params.shares,
  });
}

/**
 * Withdraw - Updates Market totals + Position supplyShares
 */
export async function updateStateOnWithdraw(
  event: {
    chainId: number;
    block: { timestamp: number };
    params: { id: string; onBehalf: string; assets: bigint; shares: bigint };
  },
  context: StateContext
) {
  const mktId = marketId(event.chainId, event.params.id);

  // Update Market
  const market = await context.Market.get(mktId);
  if (market) {
    context.Market.set({
      ...market,
      totalSupplyAssets: market.totalSupplyAssets - event.params.assets,
      totalSupplyShares: market.totalSupplyShares - event.params.shares,
      lastUpdate: BigInt(event.block.timestamp),
    });
  }

  // Update Position
  const position = await getOrCreatePosition(
    context,
    event.chainId,
    event.params.id,
    event.params.onBehalf
  );
  context.Position.set({
    ...position,
    supplyShares: position.supplyShares - event.params.shares,
  });
}

/**
 * SupplyCollateral - Updates Market.collateralAssets + Position collateral
 */
export async function updateStateOnSupplyCollateral(
  event: {
    chainId: number;
    block: { timestamp: number };
    params: { id: string; onBehalf: string; assets: bigint };
  },
  context: StateContext
) {
  const mktId = marketId(event.chainId, event.params.id);

  // Update Market lastUpdate
  const market = await context.Market.get(mktId);
  if (market) {
    context.Market.set({
      ...market,
      collateralAssets: market.collateralAssets + event.params.assets,
      lastUpdate: BigInt(event.block.timestamp),
    });
  }

  // Upsert Position
  const position = await getOrCreatePosition(
    context,
    event.chainId,
    event.params.id,
    event.params.onBehalf
  );
  context.Position.set({
    ...position,
    collateral: position.collateral + event.params.assets,
  });
}

/**
 * WithdrawCollateral - Updates Market.collateralAssets + Position collateral
 */
export async function updateStateOnWithdrawCollateral(
  event: {
    chainId: number;
    block: { timestamp: number };
    params: { id: string; onBehalf: string; assets: bigint };
  },
  context: StateContext
) {
  const mktId = marketId(event.chainId, event.params.id);

  // Update Market lastUpdate
  const market = await context.Market.get(mktId);
  if (market) {
    context.Market.set({
      ...market,
      collateralAssets: market.collateralAssets - event.params.assets,
      lastUpdate: BigInt(event.block.timestamp),
    });
  }

  // Update Position
  const position = await getOrCreatePosition(
    context,
    event.chainId,
    event.params.id,
    event.params.onBehalf
  );
  context.Position.set({
    ...position,
    collateral: position.collateral - event.params.assets,
  });
}

/**
 * Borrow - Updates Market totals + Position borrowShares
 */
export async function updateStateOnBorrow(
  event: {
    chainId: number;
    block: { timestamp: number };
    params: { id: string; onBehalf: string; assets: bigint; shares: bigint };
  },
  context: StateContext
) {
  const mktId = marketId(event.chainId, event.params.id);

  // Update Market
  const market = await context.Market.get(mktId);
  if (market) {
    context.Market.set({
      ...market,
      totalBorrowAssets: market.totalBorrowAssets + event.params.assets,
      totalBorrowShares: market.totalBorrowShares + event.params.shares,
      lastUpdate: BigInt(event.block.timestamp),
    });
  }

  // Update Position
  const position = await getOrCreatePosition(
    context,
    event.chainId,
    event.params.id,
    event.params.onBehalf
  );
  context.Position.set({
    ...position,
    borrowShares: position.borrowShares + event.params.shares,
  });
}

/**
 * Repay - Updates Market totals + Position borrowShares
 */
export async function updateStateOnRepay(
  event: {
    chainId: number;
    block: { timestamp: number };
    params: { id: string; onBehalf: string; assets: bigint; shares: bigint };
  },
  context: StateContext
) {
  const mktId = marketId(event.chainId, event.params.id);

  // Update Market
  const market = await context.Market.get(mktId);
  if (market) {
    context.Market.set({
      ...market,
      totalBorrowAssets: market.totalBorrowAssets - event.params.assets,
      totalBorrowShares: market.totalBorrowShares - event.params.shares,
      lastUpdate: BigInt(event.block.timestamp),
    });
  }

  // Update Position
  const position = await getOrCreatePosition(
    context,
    event.chainId,
    event.params.id,
    event.params.onBehalf
  );
  context.Position.set({
    ...position,
    borrowShares: position.borrowShares - event.params.shares,
  });
}

/**
 * Liquidate - Updates Market totals + Position (borrower)
 */
export async function updateStateOnLiquidate(
  event: {
    chainId: number;
    block: { timestamp: number };
    params: {
      id: string;
      borrower: string;
      repaidAssets: bigint;
      repaidShares: bigint;
      seizedAssets: bigint;
      badDebtAssets: bigint;
      badDebtShares: bigint;
    };
  },
  context: StateContext
) {
  const mktId = marketId(event.chainId, event.params.id);

  // Update Market
  const market = await context.Market.get(mktId);
  if (market) {
    context.Market.set({
      ...market,
      totalSupplyAssets: market.totalSupplyAssets - event.params.badDebtAssets,
      totalSupplyShares: market.totalSupplyShares - event.params.badDebtShares,
      totalBorrowAssets: market.totalBorrowAssets - event.params.repaidAssets,
      totalBorrowShares: market.totalBorrowShares - event.params.repaidShares,
      accruedBadDebtAssets: market.accruedBadDebtAssets + event.params.badDebtAssets,
      accruedBadDebtShares: market.accruedBadDebtShares + event.params.badDebtShares,
      collateralAssets: market.collateralAssets - event.params.seizedAssets,
      lastUpdate: BigInt(event.block.timestamp),
    });
  }

  // Update Position (borrower)
  const position = await getOrCreatePosition(
    context,
    event.chainId,
    event.params.id,
    event.params.borrower
  );
  context.Position.set({
    ...position,
    collateral: position.collateral - event.params.seizedAssets,
    borrowShares: position.borrowShares - event.params.repaidShares - event.params.badDebtShares,
  });
}

/**
 * SetAuthorization - Upserts Authorization entity
 */
export async function updateStateOnSetAuthorization(
  event: {
    chainId: number;
    params: { authorizer: string; authorized: string; newIsAuthorized: boolean };
  },
  context: StateContext
) {
  const id = authorizationId(event.chainId, event.params.authorizer, event.params.authorized);

  const authorization: Authorization = {
    id,
    chainId: event.chainId,
    authorizer: event.params.authorizer.toLowerCase(),
    authorizee: event.params.authorized.toLowerCase(),
    isAuthorized: event.params.newIsAuthorized,
  };

  context.Authorization.set(authorization);
}

// ============================================
// VaultV2 State Updates
// ============================================

async function updateVault(
  context: StateContext,
  chainId: number,
  vaultAddress: string,
  timestamp: number,
  updates: Partial<Vault>
) {
  const id = vaultId(chainId, vaultAddress);
  const vault = await context.Vault.get(id);

  if (!vault) return;

  context.Vault.set({
    ...vault,
    ...updates,
    lastUpdate: BigInt(timestamp),
  });
}

export async function updateStateOnCreateVaultV2(
  event: {
    chainId: number;
    block: { timestamp: number };
    params: { owner: string; asset: string; newVaultV2: string };
  },
  context: StateContext
) {
  const vault: Vault = {
    id: vaultId(event.chainId, event.params.newVaultV2),
    chainId: event.chainId,
    vaultAddress: normalizeAddress(event.params.newVaultV2),
    asset: normalizeAddress(event.params.asset),
    owner: normalizeAddress(event.params.owner),
    curator: undefined,
    name: undefined,
    symbol: undefined,
    adapterRegistry: undefined,
    receiveAssetsGate: undefined,
    receiveSharesGate: undefined,
    sendAssetsGate: undefined,
    sendSharesGate: undefined,
    managementFee: 0n,
    performanceFee: 0n,
    managementFeeRecipient: undefined,
    performanceFeeRecipient: undefined,
    maxRate: 0n,
    lastUpdate: BigInt(event.block.timestamp),
    totalDepositedAssets: 0n,
    totalDepositedShares: 0n,
    totalWithdrawnAssets: 0n,
    totalWithdrawnShares: 0n,
  };

  context.Vault.set(vault);
}

export async function updateStateOnCreateMorphoMarketV1Adapter(
  event: {
    chainId: number;
    srcAddress: string;
    block: { timestamp: number };
    transaction: { hash: string };
    params: { parentVault: string; morpho: string; morphoMarketV1Adapter: string };
  },
  context: StateContext
) {
  await upsertKnownAdapter(context, {
    chainId: event.chainId,
    vaultAddress: event.params.parentVault,
    adapterAddress: event.params.morphoMarketV1Adapter,
    adapterType: "MorphoMarketV1Adapter",
    factoryAddress: event.srcAddress,
    timestamp: event.block.timestamp,
    txHash: event.transaction.hash,
    morphoAddress: event.params.morpho,
  });
}

export async function updateStateOnCreateMorphoMarketV1AdapterV2(
  event: {
    chainId: number;
    srcAddress: string;
    block: { timestamp: number };
    transaction: { hash: string };
    params: { parentVault: string; morphoMarketV1AdapterV2: string };
  },
  context: StateContext
) {
  await upsertKnownAdapter(context, {
    chainId: event.chainId,
    vaultAddress: event.params.parentVault,
    adapterAddress: event.params.morphoMarketV1AdapterV2,
    adapterType: "MorphoMarketV1AdapterV2",
    factoryAddress: event.srcAddress,
    timestamp: event.block.timestamp,
    txHash: event.transaction.hash,
  });
}

export async function updateStateOnVaultDeposit(
  event: {
    chainId: number;
    srcAddress: string;
    block: { timestamp: number };
    params: { assets: bigint; shares: bigint };
  },
  context: StateContext
) {
  const vault = await context.Vault.get(vaultId(event.chainId, event.srcAddress));
  if (!vault) return;

  await updateVault(context, event.chainId, event.srcAddress, event.block.timestamp, {
    totalDepositedAssets: vault.totalDepositedAssets + event.params.assets,
    totalDepositedShares: vault.totalDepositedShares + event.params.shares,
  });
}

export async function updateStateOnVaultWithdraw(
  event: {
    chainId: number;
    srcAddress: string;
    block: { timestamp: number };
    params: { assets: bigint; shares: bigint };
  },
  context: StateContext
) {
  const vault = await context.Vault.get(vaultId(event.chainId, event.srcAddress));
  if (!vault) return;

  await updateVault(context, event.chainId, event.srcAddress, event.block.timestamp, {
    totalWithdrawnAssets: vault.totalWithdrawnAssets + event.params.assets,
    totalWithdrawnShares: vault.totalWithdrawnShares + event.params.shares,
  });
}

export async function updateStateOnVaultSetName(
  event: {
    chainId: number;
    srcAddress: string;
    block: { timestamp: number };
    params: { newName: string };
  },
  context: StateContext
) {
  await updateVault(context, event.chainId, event.srcAddress, event.block.timestamp, {
    name: event.params.newName,
  });
}

export async function updateStateOnVaultSetSymbol(
  event: {
    chainId: number;
    srcAddress: string;
    block: { timestamp: number };
    params: { newSymbol: string };
  },
  context: StateContext
) {
  await updateVault(context, event.chainId, event.srcAddress, event.block.timestamp, {
    symbol: event.params.newSymbol,
  });
}

export async function updateStateOnVaultSetOwner(
  event: {
    chainId: number;
    srcAddress: string;
    block: { timestamp: number };
    params: { newOwner: string };
  },
  context: StateContext
) {
  await updateVault(context, event.chainId, event.srcAddress, event.block.timestamp, {
    owner: normalizeAddress(event.params.newOwner),
  });
}

export async function updateStateOnVaultSetCurator(
  event: {
    chainId: number;
    srcAddress: string;
    block: { timestamp: number };
    params: { newCurator: string };
  },
  context: StateContext
) {
  await updateVault(context, event.chainId, event.srcAddress, event.block.timestamp, {
    curator: normalizeAddress(event.params.newCurator),
  });
}

export async function updateStateOnVaultSetAdapterRegistry(
  event: {
    chainId: number;
    srcAddress: string;
    block: { timestamp: number };
    params: { newAdapterRegistry: string };
  },
  context: StateContext
) {
  await updateVault(context, event.chainId, event.srcAddress, event.block.timestamp, {
    adapterRegistry: normalizeAddress(event.params.newAdapterRegistry),
  });
}

export async function updateStateOnVaultSetReceiveAssetsGate(
  event: {
    chainId: number;
    srcAddress: string;
    block: { timestamp: number };
    params: { newReceiveAssetsGate: string };
  },
  context: StateContext
) {
  await updateVault(context, event.chainId, event.srcAddress, event.block.timestamp, {
    receiveAssetsGate: normalizeAddress(event.params.newReceiveAssetsGate),
  });
}

export async function updateStateOnVaultSetReceiveSharesGate(
  event: {
    chainId: number;
    srcAddress: string;
    block: { timestamp: number };
    params: { newReceiveSharesGate: string };
  },
  context: StateContext
) {
  await updateVault(context, event.chainId, event.srcAddress, event.block.timestamp, {
    receiveSharesGate: normalizeAddress(event.params.newReceiveSharesGate),
  });
}

export async function updateStateOnVaultSetSendAssetsGate(
  event: {
    chainId: number;
    srcAddress: string;
    block: { timestamp: number };
    params: { newSendAssetsGate: string };
  },
  context: StateContext
) {
  await updateVault(context, event.chainId, event.srcAddress, event.block.timestamp, {
    sendAssetsGate: normalizeAddress(event.params.newSendAssetsGate),
  });
}

export async function updateStateOnVaultSetSendSharesGate(
  event: {
    chainId: number;
    srcAddress: string;
    block: { timestamp: number };
    params: { newSendSharesGate: string };
  },
  context: StateContext
) {
  await updateVault(context, event.chainId, event.srcAddress, event.block.timestamp, {
    sendSharesGate: normalizeAddress(event.params.newSendSharesGate),
  });
}

export async function updateStateOnVaultSetManagementFee(
  event: {
    chainId: number;
    srcAddress: string;
    block: { timestamp: number };
    params: { newManagementFee: bigint };
  },
  context: StateContext
) {
  await updateVault(context, event.chainId, event.srcAddress, event.block.timestamp, {
    managementFee: event.params.newManagementFee,
  });
}

export async function updateStateOnVaultSetManagementFeeRecipient(
  event: {
    chainId: number;
    srcAddress: string;
    block: { timestamp: number };
    params: { newManagementFeeRecipient: string };
  },
  context: StateContext
) {
  await updateVault(context, event.chainId, event.srcAddress, event.block.timestamp, {
    managementFeeRecipient: normalizeAddress(event.params.newManagementFeeRecipient),
  });
}

export async function updateStateOnVaultSetPerformanceFee(
  event: {
    chainId: number;
    srcAddress: string;
    block: { timestamp: number };
    params: { newPerformanceFee: bigint };
  },
  context: StateContext
) {
  await updateVault(context, event.chainId, event.srcAddress, event.block.timestamp, {
    performanceFee: event.params.newPerformanceFee,
  });
}

export async function updateStateOnVaultSetPerformanceFeeRecipient(
  event: {
    chainId: number;
    srcAddress: string;
    block: { timestamp: number };
    params: { newPerformanceFeeRecipient: string };
  },
  context: StateContext
) {
  await updateVault(context, event.chainId, event.srcAddress, event.block.timestamp, {
    performanceFeeRecipient: normalizeAddress(event.params.newPerformanceFeeRecipient),
  });
}

export async function updateStateOnVaultSetMaxRate(
  event: {
    chainId: number;
    srcAddress: string;
    block: { timestamp: number };
    params: { newMaxRate: bigint };
  },
  context: StateContext
) {
  await updateVault(context, event.chainId, event.srcAddress, event.block.timestamp, {
    maxRate: event.params.newMaxRate,
  });
}

export async function updateStateOnVaultAddAdapter(
  event: {
    chainId: number;
    srcAddress: string;
    params: { account: string };
  },
  context: StateContext
) {
  const adapter = await getOrCreateVaultAdapter(
    context,
    event.chainId,
    event.srcAddress,
    event.params.account
  );

  context.VaultAdapter.set({
    ...adapter,
    isActive: true,
  });
}

export async function updateStateOnVaultRemoveAdapter(
  event: {
    chainId: number;
    srcAddress: string;
    params: { account: string };
  },
  context: StateContext
) {
  const adapter = await getOrCreateVaultAdapter(
    context,
    event.chainId,
    event.srcAddress,
    event.params.account
  );

  context.VaultAdapter.set({
    ...adapter,
    isActive: false,
  });
}

export async function updateStateOnVaultSetForceDeallocatePenalty(
  event: {
    chainId: number;
    srcAddress: string;
    params: { adapter: string; forceDeallocatePenalty: bigint };
  },
  context: StateContext
) {
  const adapter = await getOrCreateVaultAdapter(
    context,
    event.chainId,
    event.srcAddress,
    event.params.adapter
  );

  context.VaultAdapter.set({
    ...adapter,
    forceDeallocatePenalty: event.params.forceDeallocatePenalty,
  });
}

export async function updateStateOnVaultSetIsAllocator(
  event: {
    chainId: number;
    srcAddress: string;
    params: { account: string; newIsAllocator: boolean };
  },
  context: StateContext
) {
  const allocator = await getOrCreateVaultAllocator(
    context,
    event.chainId,
    event.srcAddress,
    event.params.account
  );

  context.VaultAllocator.set({
    ...allocator,
    isAllocator: event.params.newIsAllocator,
  });
}

export async function updateStateOnVaultSetIsSentinel(
  event: {
    chainId: number;
    srcAddress: string;
    params: { account: string; newIsSentinel: boolean };
  },
  context: StateContext
) {
  const sentinel = await getOrCreateVaultSentinel(
    context,
    event.chainId,
    event.srcAddress,
    event.params.account
  );

  context.VaultSentinel.set({
    ...sentinel,
    isSentinel: event.params.newIsSentinel,
  });
}

export async function updateStateOnVaultSetAbsoluteCap(
  event: {
    chainId: number;
    srcAddress: string;
    block: { timestamp: number };
    params: { id: string; idData: string; newAbsoluteCap: bigint };
  },
  context: StateContext
) {
  const cap = await getOrCreateVaultCap(
    context,
    event.chainId,
    event.srcAddress,
    event.params.id,
    event.params.idData,
    event.block.timestamp
  );

  context.VaultCap.set({
    ...cap,
    paramIdData: event.params.idData,
    absoluteCap: event.params.newAbsoluteCap,
    lastUpdate: BigInt(event.block.timestamp),
  });
}

export async function updateStateOnVaultSetRelativeCap(
  event: {
    chainId: number;
    srcAddress: string;
    block: { timestamp: number };
    params: { id: string; idData: string; newRelativeCap: bigint };
  },
  context: StateContext
) {
  const cap = await getOrCreateVaultCap(
    context,
    event.chainId,
    event.srcAddress,
    event.params.id,
    event.params.idData,
    event.block.timestamp
  );

  context.VaultCap.set({
    ...cap,
    paramIdData: event.params.idData,
    relativeCap: event.params.newRelativeCap,
    lastUpdate: BigInt(event.block.timestamp),
  });
}

// ============================================
// AdaptiveCurveIrm State Updates
// ============================================

/**
 * BorrowRateUpdate - Updates Market.rateAtTarget
 */
export async function updateStateOnBorrowRateUpdate(
  event: {
    chainId: number;
    params: { id: string; rateAtTarget: bigint };
  },
  context: StateContext
) {
  const id = marketId(event.chainId, event.params.id);
  const market = await context.Market.get(id);

  if (market) {
    context.Market.set({
      ...market,
      rateAtTarget: event.params.rateAtTarget,
    });
  }
}
