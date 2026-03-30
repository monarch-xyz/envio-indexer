import { normalizeAddress } from "./ids";

export type LegacyVaultVersion = "v1" | "v1.1";

const legacyVaultFactories: Record<number, Record<string, LegacyVaultVersion>> = {
  1: {
    [normalizeAddress("0xA9c3D3a366466Fa809d1Ae982Fb2c46E5fC41101")]: "v1",
    [normalizeAddress("0x1897A8997241C1cD4bD0698647e4EB7213535c24")]: "v1.1",
  },
  10: {
    [normalizeAddress("0x3Bb6A6A0Bc85b367EFE0A5bAc81c5E52C892839a")]: "v1.1",
  },
  130: {
    [normalizeAddress("0xe9EdE3929F43a7062a007C3e8652e4ACa610Bdc0")]: "v1.1",
  },
  137: {
    [normalizeAddress("0xa9c87daB340631C34BB738625C70499e29ddDC98")]: "v1.1",
  },
  143: {
    [normalizeAddress("0x33f20973275B2F574488b18929cd7DCBf1AbF275")]: "v1.1",
  },
  42161: {
    [normalizeAddress("0x878988f5f561081deEa117717052164ea1Ef0c82")]: "v1.1",
  },
  8453: {
    [normalizeAddress("0xA9c3D3a366466Fa809d1Ae982Fb2c46E5fC41101")]: "v1",
    [normalizeAddress("0xFf62A7c278C62eD665133147129245053Bbf5918")]: "v1.1",
  },
  999: {
    [normalizeAddress("0xec051b19d654C48c357dC974376DeB6272f24e53")]: "v1.1",
  },
  42793: {
    [normalizeAddress("0x997a79c3C04c5B9eb27d343ae126bcCFb5D74781")]: "v1.1",
  },
};

export function resolveLegacyVaultVersion(
  chainId: number,
  factoryAddress: string
): LegacyVaultVersion {
  const version = legacyVaultFactories[chainId]?.[normalizeAddress(factoryAddress)];

  if (!version) {
    throw new Error(
      `Unsupported legacy vault factory for chain ${chainId}: ${normalizeAddress(factoryAddress)}`
    );
  }

  return version;
}
