import assert from "assert";
import { TestHelpers } from "generated";
const { MockDb, Morpho } = TestHelpers;

describe("Morpho contract AccrueInterest event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for Morpho contract AccrueInterest event
  const event = Morpho.AccrueInterest.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("Morpho_AccrueInterest is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await Morpho.AccrueInterest.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    const actualMorphoAccrueInterest = mockDbUpdated.entities.Morpho_AccrueInterest.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    assert(actualMorphoAccrueInterest);
    assert.equal(
      actualMorphoAccrueInterest.id,
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );
    assert.equal(actualMorphoAccrueInterest.market_id, event.params.id);
    assert.equal(actualMorphoAccrueInterest.prevBorrowRate, event.params.prevBorrowRate);
    assert.equal(actualMorphoAccrueInterest.interest, event.params.interest);
    assert.equal(actualMorphoAccrueInterest.feeShares, event.params.feeShares);
    assert.equal(actualMorphoAccrueInterest.chainId, event.chainId);
    assert.equal(actualMorphoAccrueInterest.timestamp, BigInt(event.block.timestamp));
    assert.equal(actualMorphoAccrueInterest.txHash, event.transaction.hash);
  });
});
