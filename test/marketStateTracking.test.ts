import assert from "assert";
import { marketId, positionId } from "../src/ids";
import {
  updateStateOnBorrow,
  updateStateOnCreateMarket,
  updateStateOnLiquidate,
  updateStateOnSupply,
  updateStateOnSupplyCollateral,
  updateStateOnWithdrawCollateral,
} from "../src/stateTracking";

const createMarketContext = () => {
  const markets = new Map<string, any>();
  const positions = new Map<string, any>();

  return {
    markets,
    positions,
    context: {
      Market: {
        get: async (id: string) => markets.get(id),
        set: (entity: any) => markets.set(entity.id, entity),
      },
      Position: {
        get: async (id: string) => positions.get(id),
        set: (entity: any) => positions.set(entity.id, entity),
      },
    } as any,
  };
};

describe("Market collateral state tracking", () => {
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
        block: { timestamp: 101 },
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
        block: { timestamp: 102 },
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
        block: { timestamp: 103 },
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
        block: { timestamp: 201 },
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
        block: { timestamp: 202 },
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
        block: { timestamp: 203 },
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
        block: { timestamp: 204 },
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
    assert.equal(market.totalSupplyShares, 85n);
    assert.equal(market.totalBorrowAssets, 40n);
    assert.equal(market.totalBorrowShares, 40n);
    assert.equal(market.accruedBadDebtAssets, 15n);
    assert.equal(market.accruedBadDebtShares, 15n);
  });
});
