import { ImageResponse } from "next/og";

/**
 * Apple touch icon, generated as a PNG at build time.
 *
 * iOS ignores SVG for `apple-touch-icon`, so icon.svg alone would leave a
 * home-screen shortcut showing a screenshot of the page instead of the mark.
 * Same artwork, rasterised — and with no rounded corners, because iOS applies
 * its own mask and a pre-rounded square ends up double-rounded.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B2447",
        }}
      >
        <svg width="120" height="120" viewBox="0 0 40 40" fill="none">
          <path
            d="M28.5 11.5C28.5 7.5 11.5 7.5 11.5 14C11.5 20.5 28.5 19.5 28.5 26C28.5 32.5 11.5 32.5 11.5 28.5"
            stroke="#ffffff"
            strokeWidth="4.4"
            strokeLinecap="round"
          />
          <path
            d="M28.5 26C28.5 32.5 11.5 32.5 11.5 28.5"
            stroke="#FF5A1F"
            strokeWidth="4.4"
            strokeLinecap="round"
          />
          <circle cx="11.5" cy="28.5" r="3.2" fill="#FF5A1F" />
        </svg>
      </div>
    ),
    size,
  );
}
