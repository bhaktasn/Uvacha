import { ImageResponse } from "next/og";

export const alt = "Uvacha | Creator Launchpad";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          background: "#050505",
          color: "#fdf8e1",
          position: "relative",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -180,
            right: -120,
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: "rgba(245, 214, 123, 0.18)",
            filter: "blur(110px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -220,
            left: -100,
            width: 620,
            height: 620,
            borderRadius: "50%",
            background: "rgba(192, 143, 44, 0.2)",
            filter: "blur(120px)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "72px",
            zIndex: 1,
          }}
        >
          <div
            style={{
              letterSpacing: "0.34em",
              textTransform: "uppercase",
              color: "#f5d67b",
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            Uvacha
          </div>
          <div
            style={{
              marginTop: 28,
              maxWidth: 920,
              fontSize: 64,
              lineHeight: 1.1,
              fontWeight: 700,
            }}
          >
            Creator launchpad for daily AI video battles.
          </div>
          <div
            style={{
              marginTop: 24,
              color: "rgba(253, 248, 225, 0.8)",
              fontSize: 30,
            }}
          >
            Submit. Get rated. Win USDC.
          </div>
        </div>
      </div>
    ),
    size
  );
}
