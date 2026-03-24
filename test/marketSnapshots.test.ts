import assert from "assert";
import { marketDailySnapshotId, marketHourlySnapshotId, marketId } from "../src/ids";
import { enrichMarketWithDerivedRates } from "../src/marketSnapshots";
import {
  updateStateOnBorrow,
  updateStateOnCreateMarket,
  updateStateOnSupply,
} from "../src/stateTracking";

const ADAPTIVE_CURVE_IRM = "0x870ac11d48b15db9a138cf899d20f13f79ba00bc";

const createContext = () => {
  const markets = new Map<string, any>();
  const marketHourlySnapshots = new Map<string, any>();
  const marketDailySnapshots = new Map<string, any>();
  const positions = new Map<string, any>();

  return {
    markets,
    marketHourlySnapshots,
    marketDailySnapshots,
    positions,
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
    } as any,
  };
};

async function createAdaptiveCurveMarket(context: any, chainId: number, id: string) {
  await updateStateOnCreateMarket(
    {
      chainId,
      block: { timestamp: 1_000 },
      params: {
        id,
        marketParams: [
          "0xL000000000000000000000000000000000000001",
          "0xC000000000000000000000000000000000000001",
          "0xO000000000000000000000000000000000000001",
          ADAPTIVE_CURVE_IRM,
          860000000000000000n,
        ] as const,
      },
    },
    context
  );
}

describe("Market snapshots", () => {
  it("upserts a single hourly snapshot per market bucket", async () => {
    const { markets, marketHourlySnapshots, marketDailySnapshots, context } = createContext();
    const chainId = 1;
    const marketIdValue = "0xsnapshot-market";

    await createAdaptiveCurveMarket(context, chainId, marketIdValue);

    await updateStateOnSupply(
      {
        chainId,
        block: { number: 2, timestamp: 1_100 },
        params: {
          id: marketIdValue,
          onBehalf: "0xS000000000000000000000000000000000000001",
          assets: 100n,
          shares: 100n,
        },
      },
      context
    );

    await updateStateOnBorrow(
      {
        chainId,
        block: { number: 3, timestamp: 1_200 },
        params: {
          id: marketIdValue,
          onBehalf: "0xB000000000000000000000000000000000000001",
          assets: 40n,
          shares: 40n,
        },
      },
      context
    );

    assert.equal(marketHourlySnapshots.size, 1);
    assert.equal(marketDailySnapshots.size, 1);

    const hourly = marketHourlySnapshots.get(
      marketHourlySnapshotId(chainId, marketIdValue, 0n)
    );
    assert.ok(hourly);
    assert.equal(hourly.market_id, marketId(chainId, marketIdValue));
    assert.equal(hourly.bucketStart, 0n);
    assert.equal(hourly.timestamp, 1_200n);
    assert.equal(hourly.blockNumber, 3n);
    assert.equal(hourly.totalSupplyAssets, 100n);
    assert.equal(hourly.totalBorrowAssets, 40n);
    assert.equal(hourly.suppliedAssets, 100n);
    assert.equal(hourly.borrowedAssets, 40n);
    assert.equal(hourly.netSupplyAssetsChange, 100n);
    assert.equal(hourly.netBorrowAssetsChange, 40n);
    assert.equal(hourly.borrowRateApr > 0n, true);
  });

  it("rolls hourly snapshots across buckets while keeping one daily snapshot", async () => {
    const { marketHourlySnapshots, marketDailySnapshots, context } = createContext();
    const chainId = 1;
    const marketIdValue = "0xrollover-market";

    await createAdaptiveCurveMarket(context, chainId, marketIdValue);

    await updateStateOnSupply(
      {
        chainId,
        block: { number: 2, timestamp: 1_100 },
        params: {
          id: marketIdValue,
          onBehalf: "0xS000000000000000000000000000000000000001",
          assets: 100n,
          shares: 100n,
        },
      },
      context
    );

    await updateStateOnSupply(
      {
        chainId,
        block: { number: 3, timestamp: 3_700 },
        params: {
          id: marketIdValue,
          onBehalf: "0xS000000000000000000000000000000000000001",
          assets: 50n,
          shares: 50n,
        },
      },
      context
    );

    assert.equal(marketHourlySnapshots.size, 2);
    assert.equal(marketDailySnapshots.size, 1);
    assert.ok(marketHourlySnapshots.get(marketHourlySnapshotId(chainId, marketIdValue, 0n)));
    assert.ok(
      marketHourlySnapshots.get(marketHourlySnapshotId(chainId, marketIdValue, 3_600n))
    );
    assert.ok(marketDailySnapshots.get(marketDailySnapshotId(chainId, marketIdValue, 0n)));
  });

  it("matches Morpho blue-sdk APR math for adaptive curve markets", () => {
    const timestamp = 1_711_111_111n;
    const market = enrichMarketWithDerivedRates(
      {
        id: marketId(1, "0xmath-market"),
        chainId: 1,
        marketId: "0xmath-market",
        loanToken: "0xL000000000000000000000000000000000000001",
        collateralToken: "0xC000000000000000000000000000000000000001",
        oracle: "0xO000000000000000000000000000000000000001",
        irm: ADAPTIVE_CURVE_IRM,
        lltv: 860000000000000000n,
        totalSupplyAssets: 100n,
        totalSupplyShares: 10000000n,
        totalBorrowAssets: 90n,
        totalBorrowShares: 9000000n,
        accruedBadDebtAssets: 0n,
        accruedBadDebtShares: 0n,
        collateralAssets: 0n,
        lastUpdate: timestamp,
        fee: 250000000000000000n,
        utilization: 0n,
        avgBorrowRate: 0n,
        avgSupplyRate: 0n,
        borrowRateApr: 0n,
        supplyRateApr: 0n,
        rateAtTarget: 100000000000000000n / 31_536_000n,
        rateAtTargetApr: 0n,
      },
      timestamp
    );

    assert.equal(market.utilization, 900000000000000000n);
    assert.equal(market.avgBorrowRate * 31_536_000n, 99999999988128000n);
    assert.equal(market.borrowRateApr, 99999999988128000n);
    assert.equal(market.avgSupplyRate * 31_536_000n, 67500000003024000n);
    assert.equal(market.supplyRateApr, 67500000003024000n);
    assert.equal(market.rateAtTargetApr, 99999999988128000n);
  });

  it("preserves Morpho lastUpdate semantics on non-accrual mutations", async () => {
    const { markets, context } = createContext();
    const chainId = 1;
    const marketIdValue = "0xlast-update-market";

    await createAdaptiveCurveMarket(context, chainId, marketIdValue);

    await updateStateOnSupply(
      {
        chainId,
        block: { number: 2, timestamp: 5_000 },
        params: {
          id: marketIdValue,
          onBehalf: "0xS000000000000000000000000000000000000001",
          assets: 100n,
          shares: 100n,
        },
      },
      context
    );

    const market = markets.get(marketId(chainId, marketIdValue));
    assert.ok(market);
    assert.equal(market.lastUpdate, 1_000n);
  });
});
