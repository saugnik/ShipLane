import bwipjs from "bwip-js/node";

/**
 * Code128 renderer for LRNs, box AWBs and master dockets.
 *
 * The same value is drawn several times per document set (an LRN appears on
 * three LR copies and on every box tag), so results are memoised per process.
 */
const cache = new Map<string, Uint8Array>();

export type BarcodeOptions = {
  /** Bar height in millimetres. */
  heightMm?: number;
  /** Pixel density multiplier — 3 keeps bars crisp at print resolution. */
  scale?: number;
  /** Render the human-readable value beneath the bars. */
  includeText?: boolean;
};

export async function code128(value: string, options: BarcodeOptions = {}): Promise<Uint8Array> {
  const { heightMm = 10, scale = 3, includeText = false } = options;
  const key = `${value}|${heightMm}|${scale}|${includeText}`;

  const hit = cache.get(key);
  if (hit) return hit;

  const png = await bwipjs.toBuffer({
    bcid: "code128",
    text: value,
    scale,
    height: heightMm,
    includetext: includeText,
    textxalign: "center",
    textsize: 8,
    paddingwidth: 0,
    paddingheight: 0,
    backgroundcolor: "FFFFFF",
  });

  const bytes = new Uint8Array(png);
  cache.set(key, bytes);
  return bytes;
}
