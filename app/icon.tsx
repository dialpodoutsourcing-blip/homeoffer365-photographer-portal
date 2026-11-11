import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

const logoData = await readFile(join(process.cwd(), "public/images/brand/home-offer-365-logo.png"), "base64");
const logoSrc = `data:image/png;base64,${logoData}`;

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: 32, height: 32, display: "flex", overflow: "hidden", background: "white" }}>
        <img src={logoSrc} alt="" width={80} height={32} style={{ objectFit: "cover", objectPosition: "left center" }} />
      </div>
    ),
    size,
  );
}
