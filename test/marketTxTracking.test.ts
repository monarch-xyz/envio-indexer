import assert from "assert";
import {
  trackMarketBorrowTx,
  trackMarketLegacyReallocateSupplyTx,
  trackMarketSupplyCollateralTx,
  trackMarketSupplyTx,
} from "../src/txTracking";

const createMarketTxContextStore = () => {
  const entities = new Map<string, any>();

  return {
    entities,
    context: {
      MarketTxContext: {
        get: async (id: string) => entities.get(id),
        set: (entity: any) => entities.set(entity.id, entity),
      },
    } as any,
  };
};

describe("Market transaction context projection", () => {
  it("deduplicates repeated market touches within the same transaction", async () => {
    const { entities, context } = createMarketTxContextStore();

    const event = {
      chainId: 8453,
      block: { number: 123456, timestamp: 1710000000 },
      transaction: { hash: "0xABC", transactionIndex: 17 },
      params: { id: "0x9103c30000000000000000000000000000000000000000000000000000001836" },
    };

    await trackMarketSupplyTx(event, context);
    await trackMarketBorrowTx(event, context);

    assert.equal(entities.size, 1);

    const entity = entities.values().next().value;
    assert.ok(entity);
    assert.equal(entity.id, `8453_${event.params.id}_8453_0xabc`);
    assert.equal(entity.txContext_id, "8453_0xabc");
    assert.equal(entity.txHash, "0xabc");
    assert.equal(entity.blockNumber, 123456n);
    assert.equal(entity.transactionIndex, 17);
    assert.equal(entity.hasSupply, true);
    assert.equal(entity.hasBorrow, true);
    assert.equal(entity.hasLoanFlow, true);
    assert.equal(entity.hasCollateralFlow, false);
  });

  it("tracks collateral-only market touches separately from loan flows", async () => {
    const { entities, context } = createMarketTxContextStore();

    await trackMarketSupplyCollateralTx(
      {
        chainId: 1,
        block: { number: 99, timestamp: 1000 },
        transaction: { hash: "0xdef", transactionIndex: 4 },
        params: { id: "0xmarket" },
      },
      context
    );

    const entity = entities.get("1_0xmarket_1_0xdef");
    assert.ok(entity);
    assert.equal(entity.hasSupplyCollateral, true);
    assert.equal(entity.hasCollateralFlow, true);
    assert.equal(entity.hasLoanFlow, false);
  });

  it("creates distinct rows per market for the same transaction", async () => {
    const { entities, context } = createMarketTxContextStore();

    const baseEvent = {
      chainId: 8453,
      block: { number: 500, timestamp: 2000 },
      transaction: { hash: "0x123", transactionIndex: 2 },
    };

    await trackMarketSupplyTx(
      {
        ...baseEvent,
        params: { id: "0xmarket-a" },
      },
      context
    );

    await trackMarketLegacyReallocateSupplyTx(
      {
        ...baseEvent,
        params: { id: "0xmarket-b" },
      },
      context
    );

    assert.equal(entities.size, 2);
    assert.ok(entities.get("8453_0xmarket-a_8453_0x123"));
    assert.ok(entities.get("8453_0xmarket-b_8453_0x123"));
  });
});
