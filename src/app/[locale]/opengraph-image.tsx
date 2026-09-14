import { ImageResponse } from "next/og";
import fs from "node:fs";
import path from "node:path";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const logoPath = path.join(process.cwd(), "public", "logo-dark.png");
  const logoData = fs.readFileSync(logoPath);
  const logoBase64 = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0c0a10",
          backgroundImage:
            "radial-gradient(circle at 30% 25%, rgba(109,40,217,0.55), transparent 55%), radial-gradient(circle at 75% 70%, rgba(249,115,22,0.4), transparent 55%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoBase64}
          width={650}
          height={325}
          alt="InstaViewStories"
          style={{
            objectFit: "contain",
          }}
        />
        <div
          style={{
            marginTop: 16,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              padding: "8px 22px",
              borderRadius: 24,
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#f1f5f9",
              fontSize: 22,
              fontWeight: 600,
              display: "flex",
            }}
          >
            🔒 100% Anonymous
          </div>
          <div
            style={{
              padding: "8px 22px",
              borderRadius: 24,
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#f1f5f9",
              fontSize: 22,
              fontWeight: 600,
              display: "flex",
            }}
          >
            ⚡ No Login Required
          </div>
          <div
            style={{
              padding: "8px 22px",
              borderRadius: 24,
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#f1f5f9",
              fontSize: 22,
              fontWeight: 600,
              display: "flex",
            }}
          >
            ✨ HD Downloads
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
