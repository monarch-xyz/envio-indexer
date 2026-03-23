import assert from "assert";
import {
  resolveVaultTxType,
  trackLegacyVaultRebalanceTx,
} from "../src/txTracking";

const createTxContextStore = () => {
  const entities = new Map<string, any>();

  return {
    entities,
    context: {
      TxContext: {
        get: async (id: string) => entities.get(id),
        set: (entity: any) => entities.set(entity.id, entity),
      },
    } as any,
  };
};

describe("Vault transaction classification", () => {
  it("classifies deposit-only txs as user deposits", () => {
    assert.equal(
      resolveVaultTxType({
        hasMorphoBlueEvent: true,
        hasVaultV2Event: true,
        hasLegacyVaultEvent: false,
        hasVaultUserDeposit: true,
        hasVaultUserWithdraw: false,
        hasVaultRebalance: false,
        hasVaultConfigChange: false,
      }),
      "user_deposit"
    );
  });

  it("classifies rebalance-only txs as rebalances", () => {
    assert.equal(
      resolveVaultTxType({
        hasMorphoBlueEvent: true,
        hasVaultV2Event: true,
        hasLegacyVaultEvent: false,
        hasVaultUserDeposit: false,
        hasVaultUserWithdraw: false,
        hasVaultRebalance: true,
        hasVaultConfigChange: false,
      }),
      "rebalance"
    );
  });

  it("classifies multi-purpose vault txs as mixed", () => {
    assert.equal(
      resolveVaultTxType({
        hasMorphoBlueEvent: true,
        hasVaultV2Event: true,
        hasLegacyVaultEvent: false,
        hasVaultUserDeposit: true,
        hasVaultUserWithdraw: false,
        hasVaultRebalance: true,
        hasVaultConfigChange: false,
      }),
      "mixed"
    );
  });

  it("classifies legacy vault txs through the same rebalance bucket", async () => {
    const { entities, context } = createTxContextStore();

    await trackLegacyVaultRebalanceTx(
      {
        chainId: 8453,
        srcAddress: "0xA000000000000000000000000000000000000001",
        block: { timestamp: 123 },
        transaction: { hash: "0xabc" },
      },
      context
    );

    const entity = entities.get("8453_0xabc");
    assert.ok(entity);
    assert.equal(entity.hasLegacyVaultEvent, true);
    assert.equal(entity.hasVaultV2Event, false);
    assert.equal(entity.hasVaultRebalance, true);
    assert.equal(entity.vaultTxType, "rebalance");
  });
});
