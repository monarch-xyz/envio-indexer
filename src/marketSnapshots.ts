import type { Market, MarketDailySnapshot, MarketHourlySnapshot } from "generated";
import { marketDailySnapshotId, marketHourlySnapshotId, normalizeAddress } from "./ids";

const WAD = 1_000000000000000000n;
const MAX_UINT_256 = (1n << 256n) - 1n;
const SECONDS_PER_HOUR = 3_600n;
const SECONDS_PER_DAY = 86_400n;
const SECONDS_PER_YEAR = 31_536_000n;

// Mirrors the Adaptive Curve IRM math from Morpho's official blue-sdk.
const CURVE_STEEPNESS = 4_000000000000000000n;
const TARGET_UTILIZATION = 90_0000000000000000n;
const INITIAL_RATE_AT_TARGET = 4_0000000000000000n / SECONDS_PER_YEAR;
const ADJUSTMENT_SPEED = 50_000000000000000000n / SECONDS_PER_YEAR;
const MIN_RATE_AT_TARGET = 10_00000000000000n / SECONDS_PER_YEAR;
const MAX_RATE_AT_TARGET = 2_000000000000000000n / SECONDS_PER_YEAR;
const LN_2_INT = 693147180559945309n;
const LN_WEI_INT = -41_446531673892822312n;
const WEXP_UPPER_BOUND = 93_859467695000404319n;
const WEXP_UPPER_VALUE =
  57716089161558943949701069502944508345128_422502756744429568n;

// Keep this aligned with the AdaptiveCurveIrm contracts registered in config.yaml.
const ADAPTIVE_CURVE_IRM_ADDRESSES_BY_CHAIN = new Map<number, Set<string>>([
  [1, new Set(["0x870ac11d48b15db9a138cf899d20f13f79ba00bc"])],
  [130, new Set(["0x9a6061d51743b31d2c3be75d83781fa423f53f0e"])],
  [137, new Set(["0xe675a2161d4a6e2de2eed70ac98eebf257fbf0b0"])],
  [143, new Set(["0x09475a3d6ea8c314c592b1a3799bde044e2f400f"])],
  [999, new Set(["0xd4a426f010986dcad727e8dd6eed44ca4a9b7483"])],
  [8453, new Set(["0x46415998764c29ab2a25cbea6254146d50d22687"])],
  [42161, new Set(["0x66f30587fb8d4206918deb78eca7d5ebbafd06da"])],
]);

type SnapshotStore<T extends SnapshotLike> = {
  get: (id: string) => Promise<T | undefined>;
  set: (entity: T) => void;
};

type MarketSnapshotContext = {
  MarketHourlySnapshot: SnapshotStore<MarketHourlySnapshot>;
  MarketDailySnapshot: SnapshotStore<MarketDailySnapshot>;
};

export type MarketSnapshotDelta = {
  interestAccruedAssets?: bigint;
  suppliedAssets?: bigint;
  withdrawnAssets?: bigint;
  borrowedAssets?: bigint;
  repaidAssets?: bigint;
  liquidatedBorrowAssets?: bigint;
  badDebtAssets?: bigint;
  suppliedCollateralAssets?: bigint;
  withdrawnCollateralAssets?: bigint;
  liquidatedCollateralAssets?: bigint;
  netSupplyAssetsChange?: bigint;
  netBorrowAssetsChange?: bigint;
  netCollateralAssetsChange?: bigint;
};

type SnapshotDeltaState = Required<MarketSnapshotDelta>;

const EMPTY_SNAPSHOT_DELTA: SnapshotDeltaState = {
  interestAccruedAssets: 0n,
  suppliedAssets: 0n,
  withdrawnAssets: 0n,
  borrowedAssets: 0n,
  repaidAssets: 0n,
  liquidatedBorrowAssets: 0n,
  badDebtAssets: 0n,
  suppliedCollateralAssets: 0n,
  withdrawnCollateralAssets: 0n,
  liquidatedCollateralAssets: 0n,
  netSupplyAssetsChange: 0n,
  netBorrowAssetsChange: 0n,
  netCollateralAssetsChange: 0n,
};

const SNAPSHOT_DELTA_FIELDS = Object.keys(EMPTY_SNAPSHOT_DELTA) as Array<
  keyof SnapshotDeltaState
>;

type SnapshotLike = {
  id: string;
  chainId: number;
  marketId: string;
  market_id: string;
  bucketStart: bigint;
  timestamp: bigint;
  blockNumber: bigint;
  totalSupplyAssets: bigint;
  totalSupplyShares: bigint;
  totalBorrowAssets: bigint;
  totalBorrowShares: bigint;
  accruedBadDebtAssets: bigint;
  accruedBadDebtShares: bigint;
  collateralAssets: bigint;
  lastUpdate: bigint;
  fee: bigint;
  utilization: bigint;
  avgBorrowRate: bigint;
  avgSupplyRate: bigint;
  borrowRateApr: bigint;
  supplyRateApr: bigint;
  rateAtTarget: bigint;
  rateAtTargetApr: bigint;
  interestAccruedAssets: bigint;
  suppliedAssets: bigint;
  withdrawnAssets: bigint;
  borrowedAssets: bigint;
  repaidAssets: bigint;
  liquidatedBorrowAssets: bigint;
  badDebtAssets: bigint;
  suppliedCollateralAssets: bigint;
  withdrawnCollateralAssets: bigint;
  liquidatedCollateralAssets: bigint;
  netSupplyAssetsChange: bigint;
  netBorrowAssetsChange: bigint;
  netCollateralAssetsChange: bigint;
};

type DerivedMarketRates = Pick<
  Market,
  | "utilization"
  | "avgBorrowRate"
  | "avgSupplyRate"
  | "borrowRateApr"
  | "supplyRateApr"
  | "rateAtTargetApr"
>;

export function enrichMarketWithDerivedRates(
  market: Market,
  timestamp: bigint
): Market {
  return {
    ...market,
    ...deriveMarketRates(market, timestamp),
  };
}

export async function upsertMarketSnapshots(
  context: MarketSnapshotContext,
  market: Market,
  blockNumber: number,
  timestamp: number,
  delta: MarketSnapshotDelta = {}
) {
  const timestampBigInt = BigInt(timestamp);
  const blockNumberBigInt = BigInt(blockNumber);
  const hourlyBucketStart = getHourBucketStart(timestampBigInt);
  const dailyBucketStart = getDayBucketStart(timestampBigInt);

  // Snapshots are sparse: one row per touched bucket, overwritten by later events in that bucket.
  const [hourlySnapshot, dailySnapshot] = await Promise.all([
    upsertSnapshot(
      context.MarketHourlySnapshot,
      market,
      marketHourlySnapshotId(market.chainId, market.marketId, hourlyBucketStart),
      hourlyBucketStart,
      timestampBigInt,
      blockNumberBigInt,
      delta
    ),
    upsertSnapshot(
      context.MarketDailySnapshot,
      market,
      marketDailySnapshotId(market.chainId, market.marketId, dailyBucketStart),
      dailyBucketStart,
      timestampBigInt,
      blockNumberBigInt,
      delta
    ),
  ]);

  context.MarketHourlySnapshot.set(hourlySnapshot);
  context.MarketDailySnapshot.set(dailySnapshot);
}

function deriveMarketRates(market: Market, timestamp: bigint): DerivedMarketRates {
  const utilization = getUtilization(market.totalSupplyAssets, market.totalBorrowAssets);
  const rateAtTargetApr = annualizeRate(market.rateAtTarget);

  if (market.totalBorrowAssets === 0n) {
    return {
      utilization,
      avgBorrowRate: 0n,
      avgSupplyRate: 0n,
      borrowRateApr: 0n,
      supplyRateApr: 0n,
      rateAtTargetApr,
    };
  }

  if (!isAdaptiveCurveIrmMarket(market)) {
    const avgBorrowRate = market.avgBorrowRate;
    const avgSupplyRate = getSupplyRate(avgBorrowRate, utilization, market.fee);

    return {
      utilization,
      avgBorrowRate,
      avgSupplyRate,
      borrowRateApr: annualizeRate(avgBorrowRate),
      supplyRateApr: annualizeRate(avgSupplyRate),
      rateAtTargetApr,
    };
  }

  const elapsed = timestamp > market.lastUpdate ? timestamp - market.lastUpdate : 0n;
  const { avgBorrowRate } = getAdaptiveCurveBorrowRate(utilization, market.rateAtTarget, elapsed);
  const avgSupplyRate = getSupplyRate(avgBorrowRate, utilization, market.fee);

  return {
    utilization,
    avgBorrowRate,
    avgSupplyRate,
    borrowRateApr: annualizeRate(avgBorrowRate),
    supplyRateApr: annualizeRate(avgSupplyRate),
    rateAtTargetApr,
  };
}

function isAdaptiveCurveIrmMarket(market: Market) {
  const irms = ADAPTIVE_CURVE_IRM_ADDRESSES_BY_CHAIN.get(market.chainId);
  if (!irms) return false;
  return irms.has(normalizeAddress(market.irm));
}

function getUtilization(totalSupplyAssets: bigint, totalBorrowAssets: bigint) {
  if (totalSupplyAssets === 0n) {
    return totalBorrowAssets > 0n ? MAX_UINT_256 : 0n;
  }

  return wDivDown(totalBorrowAssets, totalSupplyAssets);
}

function getSupplyRate(borrowRate: bigint, utilization: bigint, fee: bigint) {
  return wMulUp(wMulDown(borrowRate, utilization), WAD - fee);
}

function annualizeRate(rate: bigint) {
  return rate * SECONDS_PER_YEAR;
}

function getAdaptiveCurveBorrowRate(
  startUtilization: bigint,
  startRateAtTarget: bigint,
  elapsed: bigint
) {
  const errNormFactor =
    startUtilization > TARGET_UTILIZATION ? WAD - TARGET_UTILIZATION : TARGET_UTILIZATION;
  const err = wDivDown(startUtilization - TARGET_UTILIZATION, errNormFactor);

  let avgRateAtTarget: bigint;
  let endRateAtTarget: bigint;

  if (startRateAtTarget === 0n) {
    avgRateAtTarget = INITIAL_RATE_AT_TARGET;
    endRateAtTarget = INITIAL_RATE_AT_TARGET;
  } else {
    const speed = wMulDown(ADJUSTMENT_SPEED, err);
    const linearAdaptation = speed * elapsed;

    if (linearAdaptation === 0n) {
      avgRateAtTarget = startRateAtTarget;
      endRateAtTarget = startRateAtTarget;
    } else {
      const newRateAtTarget = (adaptation: bigint) =>
        min(
          max(wMulDown(startRateAtTarget, wExp(adaptation)), MIN_RATE_AT_TARGET),
          MAX_RATE_AT_TARGET
        );

      endRateAtTarget = newRateAtTarget(linearAdaptation);
      avgRateAtTarget =
        (startRateAtTarget +
          endRateAtTarget +
          2n * newRateAtTarget(linearAdaptation / 2n)) /
        4n;
    }
  }

  const coeff =
    err < 0n ? WAD - wDivDown(WAD, CURVE_STEEPNESS) : CURVE_STEEPNESS - WAD;

  const curve = (rateAtTarget: bigint) =>
    wMulDown(wMulDown(coeff, err) + WAD, rateAtTarget);

  return {
    avgBorrowRate: curve(avgRateAtTarget),
    endBorrowRate: curve(endRateAtTarget),
    endRateAtTarget,
  };
}

function wExp(x: bigint) {
  if (x < LN_WEI_INT) return 0n;
  if (x >= WEXP_UPPER_BOUND) return WEXP_UPPER_VALUE;

  const roundingAdjustment = x < 0n ? -(LN_2_INT / 2n) : LN_2_INT / 2n;
  const q = (x + roundingAdjustment) / LN_2_INT;
  const r = x - q * LN_2_INT;
  const expR = WAD + r + (r * r) / WAD / 2n;

  if (q >= 0n) return expR << q;
  return expR >> -q;
}

function getHourBucketStart(timestamp: bigint) {
  return (timestamp / SECONDS_PER_HOUR) * SECONDS_PER_HOUR;
}

function getDayBucketStart(timestamp: bigint) {
  return (timestamp / SECONDS_PER_DAY) * SECONDS_PER_DAY;
}

async function upsertSnapshot<T extends SnapshotLike>(
  store: SnapshotStore<T>,
  market: Market,
  id: string,
  bucketStart: bigint,
  timestamp: bigint,
  blockNumber: bigint,
  delta: MarketSnapshotDelta
): Promise<T> {
  const existing = await store.get(id);

  const snapshot = existing
    ? {
        ...existing,
        ...snapshotMarketState(market, bucketStart, timestamp, blockNumber),
      }
    : createEmptySnapshot(market, id, bucketStart, timestamp, blockNumber);

  return applyDelta(snapshot as T, delta);
}

function snapshotMarketState(
  market: Market,
  bucketStart: bigint,
  timestamp: bigint,
  blockNumber: bigint
) {
  return {
    chainId: market.chainId,
    marketId: market.marketId,
    market_id: market.id,
    bucketStart,
    timestamp,
    blockNumber,
    totalSupplyAssets: market.totalSupplyAssets,
    totalSupplyShares: market.totalSupplyShares,
    totalBorrowAssets: market.totalBorrowAssets,
    totalBorrowShares: market.totalBorrowShares,
    accruedBadDebtAssets: market.accruedBadDebtAssets,
    accruedBadDebtShares: market.accruedBadDebtShares,
    collateralAssets: market.collateralAssets,
    lastUpdate: market.lastUpdate,
    fee: market.fee,
    utilization: market.utilization,
    avgBorrowRate: market.avgBorrowRate,
    avgSupplyRate: market.avgSupplyRate,
    borrowRateApr: market.borrowRateApr,
    supplyRateApr: market.supplyRateApr,
    rateAtTarget: market.rateAtTarget,
    rateAtTargetApr: market.rateAtTargetApr,
  };
}

function createEmptySnapshot<T extends SnapshotLike>(
  market: Market,
  id: string,
  bucketStart: bigint,
  timestamp: bigint,
  blockNumber: bigint
): T {
  return {
    id,
    ...snapshotMarketState(market, bucketStart, timestamp, blockNumber),
    ...EMPTY_SNAPSHOT_DELTA,
  } as T;
}

function applyDelta<T extends SnapshotLike>(snapshot: T, delta: MarketSnapshotDelta): T {
  const nextSnapshot = { ...snapshot } as T & SnapshotDeltaState;

  for (const field of SNAPSHOT_DELTA_FIELDS) {
    nextSnapshot[field] = nextSnapshot[field] + (delta[field] ?? 0n);
  }

  return nextSnapshot;
}

function min(x: bigint, y: bigint) {
  return x <= y ? x : y;
}

function max(x: bigint, y: bigint) {
  return x >= y ? x : y;
}

function wMulDown(x: bigint, y: bigint) {
  return (x * y) / WAD;
}

function wMulUp(x: bigint, y: bigint) {
  return (x * y + WAD - 1n) / WAD;
}

function wDivDown(x: bigint, y: bigint) {
  if (y === 0n) {
    throw new Error("DIVISION_BY_ZERO");
  }

  return (x * WAD) / y;
}
