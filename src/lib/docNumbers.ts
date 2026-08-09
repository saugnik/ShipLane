/**
 * Document number formatting — pure, no database.
 *
 * Split out from `ids.ts` so the seed script (and any future batch tooling) can
 * mint numbers without importing the Prisma client and opening a second pool.
 *
 * Numbers must be unique, fixed-width (barcode symbologies and warehouse
 * scanners assume it) and *not* trivially sequential — a customer should not be
 * able to guess the next LRN and pull someone else's tracking page.
 *
 * We get all three by mapping a monotonic counter through a multiplicative
 * permutation: `n -> (n * ODD) mod 10^width` is a bijection whenever ODD is
 * coprime with 10^width, so distinct counters always yield distinct numbers
 * while the output order looks scattered.
 */

const SPREAD_8 = 47_593_267; // coprime with 10^8
const SPREAD_9 = 573_926_179; // coprime with 10^9
const SPREAD_12 = 738_105_926_413; // coprime with 10^12

function scatter(counter: number, spread: number, width: number): string {
  const mod = 10 ** width;
  // BigInt: counter * spread overflows the 2^53 safe-integer range for width 12.
  const value = (BigInt(counter) * BigInt(spread)) % BigInt(mod);
  return value.toString().padStart(width, "0");
}

export type DocumentNumbers = { lrn: string; oid: string; mawb: string };

/**
 * Deterministic mapping from a sequence number to the document triplet.
 * The leading digits are fixed per document type so ops can tell an LRN, an
 * order id and a master docket apart on sight.
 */
export function formatDocumentNumbers(seq: number): DocumentNumbers {
  return {
    lrn: "3" + scatter(seq, SPREAD_9, 8),
    oid: "9" + scatter(seq + 7_311, SPREAD_8, 7),
    mawb: "34" + scatter(seq, SPREAD_12, 12),
  };
}

/** Per-box scannable number, derived from the LRN so it sorts with its order. */
export function boxAwb(lrn: string, boxNumber: number): string {
  return `${lrn}${String(boxNumber).padStart(3, "0")}`;
}

/** Tag number for the loose document envelope that rides with the shipment. */
export function documentTagId(lrn: string): string {
  return `DOC_${lrn}`;
}
