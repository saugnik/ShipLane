import { prisma } from "@/lib/db";
import { formatDocumentNumbers, type DocumentNumbers } from "@/lib/docNumbers";

// Re-exported so callers have one import for document numbering.
export { boxAwb, documentTagId, formatDocumentNumbers } from "@/lib/docNumbers";
export type { DocumentNumbers } from "@/lib/docNumbers";

/** Atomically reserve the next value for a counter key. */
async function nextSequence(key: string): Promise<number> {
  const row = await prisma.counter.upsert({
    where: { key },
    create: { key, value: 1 },
    update: { value: { increment: 1 } },
  });
  return row.value;
}

/** Reserve and format the next LRN / OID / MAWB triplet. */
export async function generateDocumentNumbers(): Promise<DocumentNumbers> {
  return formatDocumentNumbers(await nextSequence("shipment"));
}
