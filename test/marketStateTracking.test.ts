import assert from "assert";
import { marketId, positionId } from "../src/ids";
import {
  updateStateOnCreateMarket,
  updateStateOnLiquidate,
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
});
