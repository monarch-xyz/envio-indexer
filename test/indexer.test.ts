import { createTestIndexer } from "envio";
import { describe, expect, it } from "vitest";

describe("Morpho AccrueInterest event", () => {
  it("creates Morpho_AccrueInterest correctly", async () => {
    const indexer = createTestIndexer();
    const chainId = 1;
    const block = { number: 123, timestamp: 456 };
    const logIndex = 7;
    const txHash = "0xabc";
    const params = {
      id: "0xmarket",
      prevBorrowRate: 1n,
      interest: 2n,
      feeShares: 3n,
    };

    await indexer.process({
      chains: {
        [chainId]: {
          simulate: [
            {
              contract: "Morpho",
              event: "AccrueInterest",
              params,
              block,
              logIndex,
              transaction: { hash: txHash },
            },
          ],
        },
      },
    });

    await expect(
      indexer.Morpho_AccrueInterest.getOrThrow(
        `${chainId}_${block.number}_${logIndex}`,
      ),
    ).resolves.toEqual({
      id: `${chainId}_${block.number}_${logIndex}`,
      market_id: params.id,
      prevBorrowRate: params.prevBorrowRate,
      interest: params.interest,
      feeShares: params.feeShares,
      chainId,
      timestamp: BigInt(block.timestamp),
      txHash,
    });
  });
});
