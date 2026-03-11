import assert from "assert";
import { resolveVaultTxType } from "../src/txTracking";

describe("Vault transaction classification", () => {
  it("classifies deposit-only txs as user deposits", () => {
    assert.equal(
      resolveVaultTxType({
        hasMorphoBlueEvent: true,
        hasVaultV2Event: true,
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
        hasVaultUserDeposit: true,
        hasVaultUserWithdraw: false,
        hasVaultRebalance: true,
        hasVaultConfigChange: false,
      }),
      "mixed"
    );
  });
});
