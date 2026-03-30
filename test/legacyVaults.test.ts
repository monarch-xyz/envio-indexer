import assert from "assert";
import { vaultId } from "../src/ids";
import { resolveLegacyVaultVersion } from "../src/legacyVaults";
import { updateStateOnCreateLegacyVault } from "../src/stateTracking";

describe("Legacy vault tracking", () => {
  it("resolves the verified legacy factory versions by chain", () => {
    assert.equal(
      resolveLegacyVaultVersion(1, "0xA9c3D3a366466Fa809d1Ae982Fb2c46E5fC41101"),
      "v1"
    );
    assert.equal(
      resolveLegacyVaultVersion(1, "0x1897A8997241C1cD4bD0698647e4EB7213535c24"),
      "v1.1"
    );
    assert.equal(
      resolveLegacyVaultVersion(10, "0x3Bb6A6A0Bc85b367EFE0A5bAc81c5E52C892839a"),
      "v1.1"
    );
    assert.equal(
      resolveLegacyVaultVersion(130, "0xe9EdE3929F43a7062a007C3e8652e4ACa610Bdc0"),
      "v1.1"
    );
    assert.equal(
      resolveLegacyVaultVersion(137, "0xa9c87daB340631C34BB738625C70499e29ddDC98"),
      "v1.1"
    );
    assert.equal(
      resolveLegacyVaultVersion(143, "0x33f20973275B2F574488b18929cd7DCBf1AbF275"),
      "v1.1"
    );
    assert.equal(
      resolveLegacyVaultVersion(42161, "0x878988f5f561081deEa117717052164ea1Ef0c82"),
      "v1.1"
    );
    assert.equal(
      resolveLegacyVaultVersion(8453, "0xFf62A7c278C62eD665133147129245053Bbf5918"),
      "v1.1"
    );
    assert.equal(
      resolveLegacyVaultVersion(999, "0xec051b19d654C48c357dC974376DeB6272f24e53"),
      "v1.1"
    );
    assert.equal(
      resolveLegacyVaultVersion(42793, "0x997a79c3C04c5B9eb27d343ae126bcCFb5D74781"),
      "v1.1"
    );
  });

  it("stores legacy vault metadata with the resolved version", async () => {
    const legacyVaults = new Map<string, any>();
    const context = {
      LegacyVault: {
        get: async (id: string) => legacyVaults.get(id),
        set: (entity: any) => legacyVaults.set(entity.id, entity),
      },
    } as any;

    await updateStateOnCreateLegacyVault(
      {
        chainId: 8453,
        srcAddress: "0xFf62A7c278C62eD665133147129245053Bbf5918",
        block: { timestamp: 123 },
        transaction: { hash: "0xabc" },
        params: {
          metaMorpho: "0xA000000000000000000000000000000000000001",
          caller: "0xB000000000000000000000000000000000000001",
          initialOwner: "0xC000000000000000000000000000000000000001",
          initialTimelock: 86_400n,
          asset: "0xD000000000000000000000000000000000000001",
          name: "Legacy Vault",
          symbol: "LVLT",
        },
      },
      context
    );

    const entity = legacyVaults.get(
      vaultId(8453, "0xA000000000000000000000000000000000000001")
    );
    assert.ok(entity);
    assert.equal(entity.vaultVersion, "v1.1");
    assert.equal(entity.factoryAddress, "0xff62a7c278c62ed665133147129245053bbf5918");
    assert.equal(entity.creator, "0xb000000000000000000000000000000000000001");
    assert.equal(entity.owner, "0xc000000000000000000000000000000000000001");
    assert.equal(entity.asset, "0xd000000000000000000000000000000000000001");
  });
});
