/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  Morpho,
  Morpho_AccrueInterest,
  Morpho_Borrow,
  Morpho_CreateMarket,
  Morpho_EnableIrm,
  Morpho_EnableLltv,
  Morpho_FlashLoan,
  Morpho_IncrementNonce,
  Morpho_Liquidate,
  Morpho_Repay,
  Morpho_SetAuthorization,
  Morpho_SetFee,
  Morpho_SetFeeRecipient,
  Morpho_SetOwner,
  Morpho_Supply,
  Morpho_SupplyCollateral,
  Morpho_Withdraw,
  Morpho_WithdrawCollateral,
} from "generated";

Morpho.AccrueInterest.handler(async ({ event, context }) => {
  const entity: Morpho_AccrueInterest = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    event_id: event.params.id,
    prevBorrowRate: event.params.prevBorrowRate,
    interest: event.params.interest,
    feeShares: event.params.feeShares,
  };

  context.Morpho_AccrueInterest.set(entity);
});

Morpho.Borrow.handler(async ({ event, context }) => {
  const entity: Morpho_Borrow = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    event_id: event.params.id,
    caller: event.params.caller,
    onBehalf: event.params.onBehalf,
    receiver: event.params.receiver,
    assets: event.params.assets,
    shares: event.params.shares,
  };

  context.Morpho_Borrow.set(entity);
});

Morpho.CreateMarket.handler(async ({ event, context }) => {
  const entity: Morpho_CreateMarket = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    event_id: event.params.id,
    marketParams_0: event.params.marketParams
        [0]
    ,
    marketParams_1: event.params.marketParams
        [1]
    ,
    marketParams_2: event.params.marketParams
        [2]
    ,
    marketParams_3: event.params.marketParams
        [3]
    ,
    marketParams_4: event.params.marketParams
        [4]
    ,
  };

  context.Morpho_CreateMarket.set(entity);
});

Morpho.EnableIrm.handler(async ({ event, context }) => {
  const entity: Morpho_EnableIrm = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    irm: event.params.irm,
  };

  context.Morpho_EnableIrm.set(entity);
});

Morpho.EnableLltv.handler(async ({ event, context }) => {
  const entity: Morpho_EnableLltv = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    lltv: event.params.lltv,
  };

  context.Morpho_EnableLltv.set(entity);
});

Morpho.FlashLoan.handler(async ({ event, context }) => {
  const entity: Morpho_FlashLoan = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    caller: event.params.caller,
    token: event.params.token,
    assets: event.params.assets,
  };

  context.Morpho_FlashLoan.set(entity);
});

Morpho.IncrementNonce.handler(async ({ event, context }) => {
  const entity: Morpho_IncrementNonce = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    caller: event.params.caller,
    authorizer: event.params.authorizer,
    usedNonce: event.params.usedNonce,
  };

  context.Morpho_IncrementNonce.set(entity);
});

Morpho.Liquidate.handler(async ({ event, context }) => {
  const entity: Morpho_Liquidate = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    event_id: event.params.id,
    caller: event.params.caller,
    borrower: event.params.borrower,
    repaidAssets: event.params.repaidAssets,
    repaidShares: event.params.repaidShares,
    seizedAssets: event.params.seizedAssets,
    badDebtAssets: event.params.badDebtAssets,
    badDebtShares: event.params.badDebtShares,
  };

  context.Morpho_Liquidate.set(entity);
});

Morpho.Repay.handler(async ({ event, context }) => {
  const entity: Morpho_Repay = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    event_id: event.params.id,
    caller: event.params.caller,
    onBehalf: event.params.onBehalf,
    assets: event.params.assets,
    shares: event.params.shares,
  };

  context.Morpho_Repay.set(entity);
});

Morpho.SetAuthorization.handler(async ({ event, context }) => {
  const entity: Morpho_SetAuthorization = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    caller: event.params.caller,
    authorizer: event.params.authorizer,
    authorized: event.params.authorized,
    newIsAuthorized: event.params.newIsAuthorized,
  };

  context.Morpho_SetAuthorization.set(entity);
});

Morpho.SetFee.handler(async ({ event, context }) => {
  const entity: Morpho_SetFee = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    event_id: event.params.id,
    newFee: event.params.newFee,
  };

  context.Morpho_SetFee.set(entity);
});

Morpho.SetFeeRecipient.handler(async ({ event, context }) => {
  const entity: Morpho_SetFeeRecipient = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    newFeeRecipient: event.params.newFeeRecipient,
  };

  context.Morpho_SetFeeRecipient.set(entity);
});

Morpho.SetOwner.handler(async ({ event, context }) => {
  const entity: Morpho_SetOwner = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    newOwner: event.params.newOwner,
  };

  context.Morpho_SetOwner.set(entity);
});

Morpho.Supply.handler(async ({ event, context }) => {
  const entity: Morpho_Supply = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    event_id: event.params.id,
    caller: event.params.caller,
    onBehalf: event.params.onBehalf,
    assets: event.params.assets,
    shares: event.params.shares,
  };

  context.Morpho_Supply.set(entity);
});

Morpho.SupplyCollateral.handler(async ({ event, context }) => {
  const entity: Morpho_SupplyCollateral = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    event_id: event.params.id,
    caller: event.params.caller,
    onBehalf: event.params.onBehalf,
    assets: event.params.assets,
  };

  context.Morpho_SupplyCollateral.set(entity);
});

Morpho.Withdraw.handler(async ({ event, context }) => {
  const entity: Morpho_Withdraw = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    event_id: event.params.id,
    caller: event.params.caller,
    onBehalf: event.params.onBehalf,
    receiver: event.params.receiver,
    assets: event.params.assets,
    shares: event.params.shares,
  };

  context.Morpho_Withdraw.set(entity);
});

Morpho.WithdrawCollateral.handler(async ({ event, context }) => {
  const entity: Morpho_WithdrawCollateral = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    event_id: event.params.id,
    caller: event.params.caller,
    onBehalf: event.params.onBehalf,
    receiver: event.params.receiver,
    assets: event.params.assets,
  };

  context.Morpho_WithdrawCollateral.set(entity);
});
