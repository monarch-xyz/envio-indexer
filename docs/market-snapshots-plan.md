# Market Snapshots On Envio

## Goal

Add market-level time-series data so the frontend can plot:

- supply over time / 24h supply change
- borrow over time / 24h borrow change
- borrow APR
- supply APR
- `rateAtTarget`

## What The Current Indexer Already Has

The live market state is already maintained incrementally in `src/stateTracking.ts`:

- `AccrueInterest` updates supply/borrow totals.
- `Supply` / `Withdraw` update total supply.
- `Borrow` / `Repay` update total borrow.
- `SupplyCollateral` / `WithdrawCollateral` / `Liquidate` update collateral.
- `BorrowRateUpdate` only updates `Market.rateAtTarget` today.

That means the indexer already has the right base state to materialize snapshots at indexing time.

## Exact Logic In `morpho-blue-subgraph`

### 1. Snapshot shape

The subgraph creates market snapshots keyed by market + hour/day bucket:

- `src/sdk/snapshots.ts`
  - `createOrUpdateMarketHourlySnapshot()`
  - `createOrUpdateMarketDailySnapshot()`

Core pattern:

- bucket id = `market.id + hourBucket` or `market.id + dayBucket`
- if the snapshot does not exist, initialize per-bucket counters to zero
- on every event touching the market, rewrite the snapshot with the current market state
- also accumulate bucket-local counters such as deposit / borrow / repay / liquidate flows

Important detail:

- the subgraph stores current market state on the snapshot, not just deltas
- so consumers can plot state directly from snapshots

### 2. Interest-rate snapshot logic

The subgraph keeps current market rates on the market, then clones them into time-bucket-specific rate records when writing snapshots.

Files:

- `src/initializers/markets.ts`: creates base `InterestRate` entities for supply and borrow
- `src/sdk/snapshots.ts`: `getSnapshotRates()`

### 3. Exact borrow/supply rate formula

The subgraph computes rates in `src/sdk/manager.ts::_updateInterestRates()`:

1. Call `irm.borrowRateView(marketParams, marketState)`
2. Convert the returned per-second WAD rate to annualized APR
3. Compute utilization
4. Apply fee haircut to derive supply APR

Formula:

```text
borrowRateApr = borrowRateView(...) / 1e18 * 31_536_000
utilization = totalBorrow / totalSupply
feesPercent = 1 - fee / 1e18
supplyRateApr = borrowRateApr * utilization * feesPercent
```

This is the logic to copy if we want parity with the subgraph.

## What Envio Supports

Envio's recommended pattern is to precompute rolling-window entities at indexing time instead of relying on query-time aggregates.

Relevant Envio guidance:

- HyperIndex docs: maintain counters / sums / rolling windows as entities keyed by date
- block handlers exist in modern Envio, but they are optional here

This repo is already configured for block handlers if we need them:

- `config.yaml`
  - `unordered_multichain_mode: true`
  - `preload_handlers: true`

Local Envio runtime constraints from `node_modules/envio/src/EventRegister.res.js`:

- block handlers are EVM-only
- block handlers are not supported in ordered multichain mode
- block handlers require `preload_handlers: true`

## Recommended Envio Design

### Option A: Event-driven snapshots only

This is the best default.

Why:

- it matches the subgraph snapshot pattern
- it avoids extra RPC load
- it is simple and robust on Envio hosted infrastructure
- it is enough for most charts, because every state-changing market event updates the bucket

Implementation:

1. Add `borrowRateApr`, `supplyRateApr`, and optionally `avgBorrowRateApr` to `Market`.
2. Add `MarketHourlySnapshot` and `MarketDailySnapshot`.
3. After every market-changing event, update the live market first, then upsert the current hour/day snapshot from the updated market state.
4. Store both:
   - closing state values
   - bucket-local deltas / flows

Suggested snapshot fields:

- `id`
- `chainId`
- `marketId`
- `market_id`
- `bucketStart`
- `timestamp`
- `blockNumber`
- `totalSupplyAssets`
- `totalSupplyShares`
- `totalBorrowAssets`
- `totalBorrowShares`
- `collateralAssets`
- `fee`
- `utilization`
- `borrowRateApr`
- `supplyRateApr`
- `avgBorrowRateApr`
- `rateAtTarget`
- `interestAccruedAssets`
- `netSupplyAssetsChange`
- `netBorrowAssetsChange`
- `netCollateralAssetsChange`
- `suppliedAssets`
- `withdrawnAssets`
- `borrowedAssets`
- `repaidAssets`
- `liquidatedAssets`
- `badDebtAssets`

This is enough to power:

- line charts for supply / borrow / rates
- 24h change metrics
- per-bucket bars for supply / borrow flows

### Option B: Exact subgraph rate parity via Effect + `eth_call`

Use this only if exact parity with the subgraph's APRs is required.

Implementation:

1. Add a `createEffect(...)` helper that performs `eth_call` against the market's IRM contract.
2. Rebuild the same `marketParams` and `marketState` tuple used in the subgraph.
3. Call `borrowRateView(...)`.
4. Convert the result to APR.
5. Derive supply APR with the same utilization / fee formula.
6. Persist those values onto `Market`, then copy them into snapshots.

This is the cleanest "exact logic" port, but it adds:

- RPC dependency management per chain
- more failure modes
- more indexing latency / cost

### Option C: Hybrid fallback without RPC

If we do not want external RPC calls, use emitted event data:

- `AccrueInterest.prevBorrowRate` as the latest actual borrow rate input
- `BorrowRateUpdate.avgBorrowRate` as the latest IRM-emitted average borrow rate
- `BorrowRateUpdate.rateAtTarget` as the latest target rate

Then derive:

```text
borrowRateApr = prevBorrowRate / 1e18 * 31_536_000
utilization = totalBorrowAssets / totalSupplyAssets
supplyRateApr = borrowRateApr * utilization * (1 - fee / 1e18)
```

This is not perfect parity with `borrowRateView(...)`, but it is the best event-only approximation and keeps the indexer self-contained.

## Recommendation

Start with:

- event-driven hourly/daily snapshots
- no block handler
- no external RPC effect
- rate fields sourced from emitted events

Reason:

- it is operationally simpler
- it already covers the product ask
- it keeps Envio indexing deterministic and cheap
- the upgrade path to exact RPC-backed parity remains straightforward

If the frontend later needs a point every hour even when a market is idle, add a block handler as a second step.

## When A Block Handler Is Worth It

Only add `onBlock(...)` if we explicitly need regular chart points during quiet periods.

Without a block handler:

- snapshots are event-driven
- quiet markets will have sparse series

With a block handler:

- we can stamp the latest market state into the current bucket even when no event happens
- but block intervals are block-count based, not wall-clock exact
- and indexing cost rises materially across all configured chains

So this should be a deliberate second step, not the default.

## Concrete Build Plan For This Repo

1. Extend `Market` with current rate fields:
   - `borrowRateApr`
   - `supplyRateApr`
   - `avgBorrowRateApr`
   - `lastRateUpdate`
2. Add `MarketHourlySnapshot`.
3. Add `MarketDailySnapshot`.
4. Add helper ids:
   - `marketHourlySnapshotId(chainId, marketId, hourBucket)`
   - `marketDailySnapshotId(chainId, marketId, dayBucket)`
5. Add a snapshot upsert helper module:
   - compute bucket start
   - initialize new bucket counters
   - copy current market state
   - apply event-local deltas
6. Wire snapshot updates from:
   - `AccrueInterest`
   - `Supply`
   - `Withdraw`
   - `SupplyCollateral`
   - `WithdrawCollateral`
   - `Borrow`
   - `Repay`
   - `Liquidate`
   - `SetFee`
   - `BorrowRateUpdate`
7. Add tests for:
   - same-bucket accumulation
   - bucket rollover
   - rate propagation
   - 24h delta derivation from snapshots

## Query Shape For The Frontend

For last 24h charts, query:

- `MarketHourlySnapshot`
- filtered by `market_id`
- ordered by `bucketStart asc`
- limited to the last 24 hour buckets

Then:

- line series: `totalSupplyAssets`, `totalBorrowAssets`, `borrowRateApr`, `supplyRateApr`, `rateAtTarget`
- 24h changes: `last.close - first.close`

## Source References

- Current Envio indexer market state: `src/stateTracking.ts`
- Current Envio indexer config: `config.yaml`
- Reference subgraph snapshots: `morpho-blue-subgraph/src/sdk/snapshots.ts`
- Reference subgraph rate calculation: `morpho-blue-subgraph/src/sdk/manager.ts`
- Reference subgraph base rate entities: `morpho-blue-subgraph/src/initializers/markets.ts`
- Envio runtime block-handler constraints: `node_modules/envio/src/EventRegister.res.js`
- Envio docs: `https://docs.envio.dev/docs/HyperIndex-LLM/hyperindex-complete`
