import assert from "assert";
import { 
  TestHelpers,
  Morpho_AccrueInterest
} from "generated";
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
    let actualMorphoAccrueInterest = mockDbUpdated.entities.Morpho_AccrueInterest.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedMorphoAccrueInterest: Morpho_AccrueInterest = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      id: event.params.id,
      prevBorrowRate: event.params.prevBorrowRate,
      interest: event.params.interest,
      feeShares: event.params.feeShares,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualMorphoAccrueInterest, expectedMorphoAccrueInterest, "Actual MorphoAccrueInterest should be the same as the expectedMorphoAccrueInterest");
  });
});
