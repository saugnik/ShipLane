/**
 * Checks the rating engine reproduces a hand-built freight manifest exactly.
 *
 * The reference figures are the ones a forwarder would compute in a
 * spreadsheet: volumetric per carton = (L x B x H) / divisor, multiplied by the
 * line quantity, summed across lines.
 *
 *   Run: npx tsx scripts/verify-weights.ts
 */
import { weighBoxes, volumetricPerCarton, type BoxInput } from "../src/lib/pricing";

const DIVISOR = 5000;

type Row = BoxInput & { expectedPerCarton: number; expectedLineVol: number };

const SHEET: Row[] = [
  { quantity: 50, lengthCm: 40, widthCm: 40, heightCm: 20, weightKg: 1, expectedPerCarton: 6.4, expectedLineVol: 320 },
  { quantity: 20, lengthCm: 10, widthCm: 10, heightCm: 15, weightKg: 1, expectedPerCarton: 0.3, expectedLineVol: 6 },
  { quantity: 5, lengthCm: 60, widthCm: 45, heightCm: 50, weightKg: 1, expectedPerCarton: 27, expectedLineVol: 135 },
];

const EXPECTED_TOTAL_VOL = 461;
const EXPECTED_BOXES = 75;

let failures = 0;
const near = (a: number, b: number) => Math.abs(a - b) < 0.01;

function check(name: string, got: number, want: number) {
  const ok = near(got, want);
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}: ${got}${ok ? "" : ` (expected ${want})`}`);
}

console.log(`Manifest (divisor ${DIVISOR})\n`);
console.log("  Qty   L x B x H     per carton   line volumetric");

let manualTotal = 0;
for (const row of SHEET) {
  const perCarton = volumetricPerCarton(row, DIVISOR);
  const lineVol = perCarton * row.quantity;
  manualTotal += lineVol;

  const ok = near(perCarton, row.expectedPerCarton) && near(lineVol, row.expectedLineVol);
  if (!ok) failures += 1;

  console.log(
    `  ${String(row.quantity).padStart(3)}   ${`${row.lengthCm}x${row.widthCm}x${row.heightCm}`.padEnd(12)} ${String(perCarton).padStart(8)}   ${String(lineVol).padStart(8)}   ${ok ? "OK" : "MISMATCH"}`,
  );
}

console.log("");
check("hand-summed total volumetric", manualTotal, EXPECTED_TOTAL_VOL);

const engine = weighBoxes(SHEET, DIVISOR);
check("engine volumetric weight", engine.volumetricWeight, EXPECTED_TOTAL_VOL);
check("engine total carton count", engine.totalBoxes, EXPECTED_BOXES);
check("engine actual weight (1 kg x 75)", engine.actualWeight, EXPECTED_BOXES);

// A quantity of 1 must behave exactly as the old one-row-per-box model did.
const single = weighBoxes([{ quantity: 1, lengthCm: 40, widthCm: 40, heightCm: 20, weightKg: 12 }], DIVISOR);
check("single carton volumetric", single.volumetricWeight, 6.4);
check("single carton actual", single.actualWeight, 12);
check("single carton count", single.totalBoxes, 1);

// Zero/blank quantities must not poison the totals.
const messy = weighBoxes(
  [
    { quantity: 0, lengthCm: 10, widthCm: 10, heightCm: 10, weightKg: 5 },
    { quantity: 3, lengthCm: 10, widthCm: 10, heightCm: 10, weightKg: 5 },
  ],
  DIVISOR,
);
check("zero-quantity line contributes nothing", messy.totalBoxes, 3);
check("zero-quantity line weight", messy.actualWeight, 15);

console.log(`\n${failures === 0 ? "ALL WEIGHT CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
