import assert from "assert";
import { adapterId, vaultAdapterId } from "../src/ids";
import {
  updateStateOnCreateMorphoMarketV1AdapterV2,
  updateStateOnCreateMorphoMarketV1Adapter,
  updateStateOnVaultAddAdapter,
} from "../src/stateTracking";

const createAdapterContext = () => {
  const adapters = new Map<string, any>();
  const vaultAdapters = new Map<string, any>();

  return {
    adapters,
    vaultAdapters,
    context: {
      Adapter: {
        get: async (id: string) => adapters.get(id),
        set: (entity: any) => adapters.set(entity.id, entity),
      },
      VaultAdapter: {
        get: async (id: string) => vaultAdapters.get(id),
        set: (entity: any) => vaultAdapters.set(entity.id, entity),
      },
    } as any,
  };
};

describe("Known adapter deployment tracking", () => {
  it("stores MorphoMarketV1Adapter deployments as known adapters", async () => {
    const { adapters, context } = createAdapterContext();

    await updateStateOnCreateMorphoMarketV1Adapter(
      {
        chainId: 8453,
        srcAddress: "0xF000000000000000000000000000000000000001",
        block: { timestamp: 123 },
        transaction: { hash: "0xabc" },
        params: {
          parentVault: "0xB000000000000000000000000000000000000001",
          morpho: "0xC000000000000000000000000000000000000001",
          morphoMarketV1Adapter: "0xA000000000000000000000000000000000000001",
        },
      },
      context
    );

    const entity = adapters.get(adapterId(8453, "0xA000000000000000000000000000000000000001"));
    assert.ok(entity);
    assert.equal(entity.adapterType, "MorphoMarketV1Adapter");
    assert.equal(entity.vaultAddress, "0xb000000000000000000000000000000000000001");
    assert.equal(entity.adapterAddress, "0xa000000000000000000000000000000000000001");
    assert.equal(entity.morphoAddress, "0xc000000000000000000000000000000000000001");
  });

  it("stores MorphoMarketV1AdapterV2 deployments as known adapters", async () => {
    const { adapters, context } = createAdapterContext();

    await updateStateOnCreateMorphoMarketV1AdapterV2(
      {
        chainId: 8453,
        srcAddress: "0xF000000000000000000000000000000000000002",
        block: { timestamp: 456 },
        transaction: { hash: "0xdef" },
        params: {
          parentVault: "0xB000000000000000000000000000000000000002",
          morphoMarketV1AdapterV2: "0xA000000000000000000000000000000000000002",
        },
      },
      context
    );

    const entity = adapters.get(adapterId(8453, "0xA000000000000000000000000000000000000002"));
    assert.ok(entity);
    assert.equal(entity.adapterType, "MorphoMarketV1AdapterV2");
    assert.equal(entity.vaultAddress, "0xb000000000000000000000000000000000000002");
    assert.equal(entity.adapterAddress, "0xa000000000000000000000000000000000000002");
    assert.equal(entity.morphoAddress, undefined);
  });

  it("handles vault attachment before known adapter deployment without ordering issues", async () => {
    const { adapters, vaultAdapters, context } = createAdapterContext();
    const vaultAddress = "0xB000000000000000000000000000000000000003";
    const adapterAddress = "0xA000000000000000000000000000000000000003";

    await updateStateOnVaultAddAdapter(
      {
        chainId: 8453,
        srcAddress: vaultAddress,
        params: { account: adapterAddress },
      },
      context
    );

    const vaultAdapter = vaultAdapters.get(vaultAdapterId(8453, vaultAddress, adapterAddress));
    assert.ok(vaultAdapter);
    assert.equal(vaultAdapter.isActive, true);
    assert.equal(vaultAdapter.adapterAddress, "0xa000000000000000000000000000000000000003");
    assert.equal(adapters.get(adapterId(8453, adapterAddress)), undefined);

    await updateStateOnCreateMorphoMarketV1AdapterV2(
      {
        chainId: 8453,
        srcAddress: "0xF000000000000000000000000000000000000003",
        block: { timestamp: 789 },
        transaction: { hash: "0xghi" },
        params: {
          parentVault: vaultAddress,
          morphoMarketV1AdapterV2: adapterAddress,
        },
      },
      context
    );

    const knownAdapter = adapters.get(adapterId(8453, adapterAddress));
    assert.ok(knownAdapter);
    assert.equal(knownAdapter.adapterType, "MorphoMarketV1AdapterV2");

    const vaultAdapterAfter = vaultAdapters.get(vaultAdapterId(8453, vaultAddress, adapterAddress));
    assert.ok(vaultAdapterAfter);
    assert.equal(vaultAdapterAfter.isActive, true);
  });
});
