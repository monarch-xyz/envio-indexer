export const normalizeAddress = (address: string) => address.toLowerCase();

export const normalizeHash = (hash: string) => hash.toLowerCase();

export const eventId = (chainId: number, blockNumber: number, logIndex: number) =>
  `${chainId}_${blockNumber}_${logIndex}`;

export const marketId = (chainId: number, id: string) => `${chainId}_${id}`;

export const marketHourlySnapshotId = (
  chainId: number,
  marketIdValue: string,
  bucketStart: bigint
) => `${marketId(chainId, marketIdValue)}_hour_${bucketStart.toString()}`;

export const marketDailySnapshotId = (
  chainId: number,
  marketIdValue: string,
  bucketStart: bigint
) => `${marketId(chainId, marketIdValue)}_day_${bucketStart.toString()}`;

export const positionId = (chainId: number, marketIdValue: string, user: string) =>
  `${chainId}_${marketIdValue}_${normalizeAddress(user)}`;

export const authorizationId = (chainId: number, authorizer: string, authorizee: string) =>
  `${chainId}_${normalizeAddress(authorizer)}_${normalizeAddress(authorizee)}`;

export const vaultId = (chainId: number, address: string) =>
  `${chainId}_${normalizeAddress(address)}`;

export const vaultRoleId = (chainId: number, vaultAddress: string, account: string) =>
  `${vaultId(chainId, vaultAddress)}_${normalizeAddress(account)}`;

export const vaultAdapterId = (chainId: number, vaultAddress: string, adapter: string) =>
  `${vaultId(chainId, vaultAddress)}_${normalizeAddress(adapter)}`;

export const adapterId = (chainId: number, address: string) =>
  `${chainId}_${normalizeAddress(address)}`;

export const vaultCapId = (chainId: number, vaultAddress: string, paramId: string) =>
  `${vaultId(chainId, vaultAddress)}_${paramId.toLowerCase()}`;

export const txContextId = (chainId: number, txHash: string) =>
  `${chainId}_${normalizeHash(txHash)}`;

export const marketTxContextId = (
  chainId: number,
  marketIdValue: string,
  txContextIdValue: string
) => `${chainId}_${marketIdValue}_${txContextIdValue}`;

export const serializeIds = (ids: readonly string[]) =>
  JSON.stringify(ids.map((id) => id.toLowerCase()));
