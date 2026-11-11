import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Home Offer 365 photographer guide in front of a welcoming American home";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const [heroData, logoData] = await Promise.all([
  readFile(join(process.cwd(), "public/images/photo-examples/pennsylvania-brick-bungalow/exterior-front.png"), "base64"),
  readFile(join(process.cwd(), "public/images/brand/home-offer-365-logo.png"), "base64"),
]);

const heroSrc = `data:image/png;base64,${heroData}`;
const logoSrc = `data:image/png;base64,${logoData}`;

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#102536",
          color: "white",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <img
          src={heroSrc}
          alt=""
          width={1200}
          height={630}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 680,
            height: "100%",
            display: "flex",
            background: "rgba(10, 31, 47, 0.9)",
          }}
        />
        <div style={{ width: 650, padding: "62px 0 58px 72px", display: "flex", flexDirection: "column", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", width: 290, height: 96, padding: "12px 20px", borderRadius: 18, background: "white" }}>
            <img src={logoSrc} alt="Home Offer 365" width={250} height={84} style={{ objectFit: "contain" }} />
          </div>
          <div style={{ marginTop: 58, display: "flex", fontSize: 25, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "#f47a2a" }}>
            Photographer Guide
          </div>
          <div style={{ marginTop: 18, display: "flex", fontSize: 64, lineHeight: 1.04, fontWeight: 800, letterSpacing: -2 }}>
            Welcome to Home Offer 365
          </div>
          <div style={{ marginTop: 24, display: "flex", fontSize: 27, lineHeight: 1.35, color: "#e5edf3" }}>
            Photo, video, and submission guidance for every property visit.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
