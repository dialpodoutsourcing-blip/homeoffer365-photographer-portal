import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const logoData = await readFile(join(process.cwd(), "public/images/brand/home-offer-365-logo.png"), "base64");
const logoSrc = `data:image/png;base64,${logoData}`;

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: 180, height: 180, display: "flex", overflow: "hidden", borderRadius: 36, background: "white" }}>
        <img src={logoSrc} alt="" width={450} height={180} style={{ objectFit: "cover", objectPosition: "left center" }} />
      </div>
    ),
    size,
  );
}
