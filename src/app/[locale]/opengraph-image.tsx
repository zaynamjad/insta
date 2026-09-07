import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
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
            "radial-gradient(circle at 30% 20%, rgba(109,40,217,0.55), transparent 55%), radial-gradient(circle at 75% 75%, rgba(249,115,22,0.4), transparent 55%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 96,
              height: 96,
              borderRadius: 28,
              backgroundImage:
                "linear-gradient(135deg, #6d28d9, #c026d3, #f97316)",
            }}
          />
          <div
            style={{
              fontSize: 76,
              fontWeight: 800,
              color: "white",
              display: "flex",
            }}
          >
            {SITE_NAME}
          </div>
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 34,
            color: "rgba(255,255,255,0.75)",
            display: "flex",
          }}
        >
          Instagram Story Viewer: View Stories Anonymously
        </div>
      </div>
    ),
    { ...size },
  );
}
