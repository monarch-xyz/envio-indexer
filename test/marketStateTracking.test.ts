import assert from "assert";
import { marketId, positionDailyFlowId, positionId } from "../src/ids";
import {
  updateStateOnBorrow,
  updateStateOnCreateMarket,
  updateStateOnLiquidate,
  updateStateOnRepay,
  updateStateOnSupply,
  updateStateOnSupplyCollateral,
  updateStateOnWithdraw,
  updateStateOnWithdrawCollateral,
} from "../src/stateTracking";

const createMarketContext = () => {
  const markets = new Map<string, any>();
  const marketHourlySnapshots = new Map<string, any>();
  const marketDailySnapshots = new Map<string, any>();
  const positions = new Map<string, any>();
  const positionDailyFlows = new Map<string, any>();

  return {
    markets,
    marketHourlySnapshots,
    marketDailySnapshots,
    positions,
    positionDailyFlows,
    context: {
      Market: {
        get: async (id: string) => markets.get(id),
        set: (entity: any) => markets.set(entity.id, entity),
      },
      MarketHourlySnapshot: {
        get: async (id: string) => marketHourlySnapshots.get(id),
        set: (entity: any) => marketHourlySnapshots.set(entity.id, entity),
      },
      MarketDailySnapshot: {
        get: async (id: string) => marketDailySnapshots.get(id),
        set: (entity: any) => marketDailySnapshots.set(entity.id, entity),
      },
      Position: {
        get: async (id: string) => positions.get(id),
        set: (entity: any) => positions.set(entity.id, entity),
      },
      PositionDailyFlow: {
        get: async (id: string) => positionDailyFlows.get(id),
        set: (entity: any) => positionDailyFlows.set(entity.id, entity),
      },
    } as any,
  };
};

describe("Market state tracking", () => {
  it("keeps signed supply flow separate from share exposure across exited periods", async () => {
    const { positions, positionDailyFlows, context } = createMarketContext();
    const chainId = 1;
    const marketIdValue = "0xmarket-supply-history";
    const supplier = "0xS000000000000000000000000000000000000010";

    await updateStateOnSupply(
      {
        chainId,
        logIndex: 0,
        block: { number: 100, timestamp: 100 },
        params: {
          id: marketIdValue,
          onBehalf: supplier,
          assets: 100n,
          shares: 100n,
        },
      },
      context
    );

    await updateStateOnWithdraw(
      {
        chainId,
        logIndex: 1,
        block: { number: 200, timestamp: 200 },
        params: {
          id: marketIdValue,
          onBehalf: supplier,
          assets: 100n,
          shares: 100n,
        },
      },
      context
    );

    await updateStateOnSupply(
      {
        chainId,
        logIndex: 2,
        block: { number: 300, timestamp: 300 },
        params: {
          id: marketIdValue,
          onBehalf: supplier,
          assets: 50n,
          shares: 50n,
        },
      },
      context
    );

    await updateStateOnWithdraw(
      {
        chainId,
        logIndex: 3,
        block: { number: 400, timestamp: 400 },
        params: {
          id: marketIdValue,
          onBehalf: supplier,
          assets: 60n,
          shares: 40n,
        },
      },
      context
    );

    await updateStateOnWithdraw(
      {
        chainId,
        logIndex: 4,
        block: { number: 500, timestamp: 500 },
        params: {
          id: marketIdValue,
          onBehalf: supplier,
          assets: 10n,
          shares: 10n,
        },
      },
      context
    );

    const position = positions.get(positionId(chainId, marketIdValue, supplier));
    assert.ok(position);
    assert.equal(position.id, positionId(chainId, marketIdValue, supplier));
    assert.equal(position.chainId, chainId);
    assert.equal(position.marketId, marketIdValue);
    assert.equal(position.user, supplier.toLowerCase());
    assert.equal(position.supplyShares, 0n);
    assert.equal(position.borrowShares, 0n);
    assert.equal(position.collateral, 0n);
    assert.equal(position.market_id, marketId(chainId, marketIdValue));
    assert.equal(position.firstSupplyTimestamp, 100n);
    assert.equal(position.lastSupplyActivityTimestamp, 500n);
    assert.equal(position.lastSupplyActivityBlockNumber, 500n);
    assert.equal(position.lastSupplyActivityLogIndex, 4);
    assert.equal(position.totalSuppliedAssets, 150n);
    assert.equal(position.totalWithdrawnAssets, 170n);
    assert.equal(position.netSupplyAssets, -20n);
    assert.equal(position.supplyAssetsPrincipal, -20n);
    assert.equal(position.supplyWeightedAssetsSeconds, 15_000n);
    assert.equal(position.supplyActiveSeconds, 200n);

    assert.equal(positionDailyFlows.size, 1);
    const dailyFlow = positionDailyFlows.get(
      positionDailyFlowId(chainId, marketIdValue, supplier, 0n)
    );
    assert.ok(dailyFlow);
    assert.equal(dailyFlow.firstActivityTimestamp, 100n);
    assert.equal(dailyFlow.lastActivityTimestamp, 500n);
    assert.equal(dailyFlow.lastActivityBlockNumber, 500n);
    assert.equal(dailyFlow.lastActivityLogIndex, 4);
    assert.equal(dailyFlow.suppliedAssets, 150n);
    assert.equal(dailyFlow.withdrawnAssets, 170n);
    assert.equal(dailyFlow.netSupplyAssets, -20n);
    assert.equal(dailyFlow.openingSupplyShares, 0n);
    assert.equal(dailyFlow.closingSupplyShares, 0n);
    assert.equal(dailyFlow.supplyWeightedSharesSeconds, 16_000n);
    assert.equal(dailyFlow.supplyActiveSeconds, 300n);
  });

  it("creates one sparse supply flow per touched day", async () => {
    const { positionDailyFlows, context } = createMarketContext();
    const chainId = 1;
    const marketIdValue = "0xmarket-daily-supply-flow";
    const supplier = "0xS000000000000000000000000000000000000011";
    const day = 86_400;

    await updateStateOnSupply(
      {
        chainId,
        block: { number: 100, timestamp: 100 },
        params: {
          id: marketIdValue,
          onBehalf: supplier,
          assets: 100n,
          shares: 100n,
        },
      },
      context
    );

    await updateStateOnWithdraw(
      {
        chainId,
        block: { number: 200, timestamp: day + 200 },
        params: {
          id: marketIdValue,
          onBehalf: supplier,
          assets: 40n,
          shares: 40n,
        },
      },
      context
    );

    await updateStateOnSupply(
      {
        chainId,
        block: { number: 300, timestamp: day + 400 },
        params: {
          id: marketIdValue,
          onBehalf: supplier,
          assets: 20n,
          shares: 20n,
        },
      },
      context
    );

    const firstDay = positionDailyFlows.get(
      positionDailyFlowId(chainId, marketIdValue, supplier, 0n)
    );
    const secondDay = positionDailyFlows.get(
      positionDailyFlowId(chainId, marketIdValue, supplier, BigInt(day))
    );

    assert.equal(positionDailyFlows.size, 2);
    assert.ok(firstDay);
    assert.equal(firstDay.suppliedAssets, 100n);
    assert.equal(firstDay.withdrawnAssets, 0n);
    assert.equal(firstDay.closingSupplyShares, 100n);

    assert.ok(secondDay);
    assert.equal(secondDay.firstActivityTimestamp, BigInt(day + 200));
    assert.equal(secondDay.lastActivityTimestamp, BigInt(day + 400));
    assert.equal(secondDay.suppliedAssets, 20n);
    assert.equal(secondDay.withdrawnAssets, 40n);
    assert.equal(secondDay.netSupplyAssets, -20n);
    assert.equal(secondDay.openingSupplyShares, 100n);
    assert.equal(secondDay.closingSupplyShares, 80n);
    assert.equal(secondDay.supplyWeightedSharesSeconds, 32_000n);
    assert.equal(secondDay.supplyActiveSeconds, 400n);
  });

  it("tracks market collateralAssets across collateral flows", async () => {
    const { markets, positions, context } = createMarketContext();
    const chainId = 1;
    const marketIdValue = "0xmarket";
    const borrower = "0xB000000000000000000000000000000000000001";

    await updateStateOnCreateMarket(
      {
        chainId,
        block: { timestamp: 100 },
        params: {
          id: marketIdValue,
          marketParams: [
            "0xL000000000000000000000000000000000000001",
            "0xC000000000000000000000000000000000000001",
            "0xO000000000000000000000000000000000000001",
            "0xI000000000000000000000000000000000000001",
            860000000000000000n,
          ] as const,
        },
      },
      context
    );

    const initialMarket = markets.get(marketId(chainId, marketIdValue));
    assert.ok(initialMarket);
    assert.equal(initialMarket.collateralAssets, 0n);
    assert.equal(initialMarket.accruedBadDebtAssets, 0n);
    assert.equal(initialMarket.accruedBadDebtShares, 0n);

    await updateStateOnSupplyCollateral(
      {
        chainId,
        block: { number: 101, timestamp: 101 },
        params: {
          id: marketIdValue,
          onBehalf: borrower,
          assets: 100n,
        },
      },
      context
    );

    await updateStateOnWithdrawCollateral(
      {
        chainId,
        block: { number: 102, timestamp: 102 },
        params: {
          id: marketIdValue,
          onBehalf: borrower,
          assets: 25n,
        },
      },
      context
    );

    await updateStateOnLiquidate(
      {
        chainId,
        block: { number: 103, timestamp: 103 },
        params: {
          id: marketIdValue,
          borrower,
          repaidAssets: 10n,
          repaidShares: 10n,
          seizedAssets: 15n,
          badDebtAssets: 0n,
          badDebtShares: 0n,
        },
      },
      context
    );

    const market = markets.get(marketId(chainId, marketIdValue));
    assert.ok(market);
    assert.equal(market.collateralAssets, 60n);

    const position = positions.get(positionId(chainId, marketIdValue, borrower));
    assert.ok(position);
    assert.equal(position.collateral, 60n);
  });

  it("tracks accrued bad debt per market across liquidations", async () => {
    const { markets, context } = createMarketContext();
    const chainId = 1;
    const marketIdValue = "0xmarket-baddebt";
    const borrower = "0xB000000000000000000000000000000000000002";
    const supplier = "0xS000000000000000000000000000000000000001";

    await updateStateOnCreateMarket(
      {
        chainId,
        block: { timestamp: 200 },
        params: {
          id: marketIdValue,
          marketParams: [
            "0xL000000000000000000000000000000000000002",
            "0xC000000000000000000000000000000000000002",
            "0xO000000000000000000000000000000000000002",
            "0xI000000000000000000000000000000000000002",
            860000000000000000n,
          ] as const,
        },
      },
      context
    );

    await updateStateOnSupply(
      {
        chainId,
        block: { number: 201, timestamp: 201 },
        params: {
          id: marketIdValue,
          onBehalf: supplier,
          assets: 100n,
          shares: 100n,
        },
      },
      context
    );

    await updateStateOnBorrow(
      {
        chainId,
        block: { number: 202, timestamp: 202 },
        params: {
          id: marketIdValue,
          onBehalf: borrower,
          assets: 80n,
          shares: 80n,
        },
      },
      context
    );

    await updateStateOnLiquidate(
      {
        chainId,
        block: { number: 203, timestamp: 203 },
        params: {
          id: marketIdValue,
          borrower,
          repaidAssets: 30n,
          repaidShares: 30n,
          seizedAssets: 0n,
          badDebtAssets: 12n,
          badDebtShares: 12n,
        },
      },
      context
    );

    await updateStateOnLiquidate(
      {
        chainId,
        block: { number: 204, timestamp: 204 },
        params: {
          id: marketIdValue,
          borrower,
          repaidAssets: 10n,
          repaidShares: 10n,
          seizedAssets: 0n,
          badDebtAssets: 3n,
          badDebtShares: 3n,
        },
      },
      context
    );

    const market = markets.get(marketId(chainId, marketIdValue));
    assert.ok(market);
    assert.equal(market.totalSupplyAssets, 85n);
    assert.equal(market.totalSupplyShares, 100n);
    assert.equal(market.totalBorrowAssets, 25n);
    assert.equal(market.totalBorrowShares, 25n);
    assert.equal(market.accruedBadDebtAssets, 15n);
    assert.equal(market.accruedBadDebtShares, 15n);
  });

  it("zero-floors borrow asset accounting when repay assets round above debt", async () => {
    const { markets, context } = createMarketContext();
    const chainId = 1;
    const marketIdValue = "0xmarket-repay-rounding";
    const borrower = "0xB000000000000000000000000000000000000003";
    const supplier = "0xS000000000000000000000000000000000000003";

    await updateStateOnCreateMarket(
      {
        chainId,
        block: { timestamp: 300 },
        params: {
          id: marketIdValue,
          marketParams: [
            "0xL000000000000000000000000000000000000003",
            "0xC000000000000000000000000000000000000003",
            "0xO000000000000000000000000000000000000003",
            "0xI000000000000000000000000000000000000003",
            860000000000000000n,
          ] as const,
        },
      },
      context
    );

    await updateStateOnSupply(
      {
        chainId,
        block: { number: 301, timestamp: 301 },
        params: {
          id: marketIdValue,
          onBehalf: supplier,
          assets: 100n,
          shares: 100n,
        },
      },
      context
    );

    await updateStateOnBorrow(
      {
        chainId,
        block: { number: 302, timestamp: 302 },
        params: {
          id: marketIdValue,
          onBehalf: borrower,
          assets: 10n,
          shares: 10n,
        },
      },
      context
    );

    await updateStateOnRepay(
      {
        chainId,
        block: { number: 303, timestamp: 303 },
        params: {
          id: marketIdValue,
          onBehalf: borrower,
          assets: 11n,
          shares: 10n,
        },
      },
      context
    );

    const market = markets.get(marketId(chainId, marketIdValue));
    assert.ok(market);
    assert.equal(market.totalBorrowAssets, 0n);
    assert.equal(market.totalBorrowShares, 0n);
  });
});
