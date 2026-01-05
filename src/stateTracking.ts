/**
 * State Tracking - Track protocol state (Market, Position, Authorization)
 * Logic translated from Ponder indexer.
 */
import type { Market, Position, Authorization } from "generated";

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
};

// ============================================
// ID Helpers
// ============================================

const marketId = (chainId: number, id: string) => `${chainId}_${id}`;
const positionId = (chainId: number, marketId: string, user: string) =>
  `${chainId}_${marketId}_${user.toLowerCase()}`;
const authorizationId = (chainId: number, authorizer: string, authorizee: string) =>
  `${chainId}_${authorizer.toLowerCase()}_${authorizee.toLowerCase()}`;

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
 * SupplyCollateral - Updates Market.lastUpdate + Position collateral
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
 * WithdrawCollateral - Updates Market.lastUpdate + Position collateral
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
