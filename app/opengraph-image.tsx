import { ImageResponse } from "next/og";

export const alt = "Uvacha | Daily Video Competition";
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
        {/* Background glows */}
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

        {/* Left: text */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "72px",
            flex: 1,
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
              display: "flex",
              flexWrap: "wrap",
              marginTop: 28,
              fontSize: 58,
              lineHeight: 1.1,
              fontWeight: 700,
            }}
          >
            <span>The daily video competition to separate </span>
            <span style={{ color: "#f5d67b" }}>art</span>
            <span> from slop.</span>
          </div>
          <div
            style={{
              marginTop: 24,
              color: "rgba(253, 248, 225, 0.6)",
              fontSize: 26,
            }}
          >
            Submit. Get rated. Win USDC.
          </div>
        </div>

        {/* Right: tournament bracket SVG */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 420,
            padding: "60px 48px 60px 0",
            zIndex: 1,
          }}
        >
          <svg
            viewBox="0 0 300 200"
            width="360"
            height="240"
            fill="none"
          >
            {/* Round 1 connectors */}
            <line x1="75" y1="27" x2="110" y2="27" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <line x1="110" y1="27" x2="110" y2="67" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <line x1="75" y1="67" x2="110" y2="67" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <line x1="110" y1="47" x2="140" y2="47" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <line x1="75" y1="117" x2="110" y2="117" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <line x1="110" y1="117" x2="110" y2="157" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <line x1="75" y1="157" x2="110" y2="157" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <line x1="110" y1="137" x2="140" y2="137" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            {/* Round 2 connectors */}
            <line x1="190" y1="47" x2="215" y2="47" stroke="rgba(245,214,123,0.25)" strokeWidth="1" />
            <line x1="215" y1="47" x2="215" y2="137" stroke="rgba(245,214,123,0.25)" strokeWidth="1" />
            <line x1="190" y1="137" x2="215" y2="137" stroke="rgba(245,214,123,0.25)" strokeWidth="1" />
            <line x1="215" y1="92" x2="235" y2="92" stroke="rgba(245,214,123,0.4)" strokeWidth="1.2" />
            {/* Round 1 videos */}
            <rect x="20" y="14" width="55" height="28" rx="4" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            <polygon points="40,22 40,36 50,29" fill="rgba(255,255,255,0.12)" />
            <rect x="20" y="54" width="55" height="28" rx="4" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            <polygon points="40,62 40,76 50,69" fill="rgba(255,255,255,0.12)" />
            <rect x="20" y="104" width="55" height="28" rx="4" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            <polygon points="40,112 40,126 50,119" fill="rgba(255,255,255,0.12)" />
            <rect x="20" y="144" width="55" height="28" rx="4" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            <polygon points="40,152 40,166 50,159" fill="rgba(255,255,255,0.12)" />
            {/* Round 2 videos */}
            <rect x="140" y="34" width="50" height="26" rx="4" fill="rgba(245,214,123,0.06)" stroke="rgba(245,214,123,0.2)" strokeWidth="1" />
            <polygon points="158,41 158,53 168,47" fill="rgba(245,214,123,0.25)" />
            <rect x="140" y="124" width="50" height="26" rx="4" fill="rgba(245,214,123,0.06)" stroke="rgba(245,214,123,0.2)" strokeWidth="1" />
            <polygon points="158,131 158,143 168,137" fill="rgba(245,214,123,0.25)" />
            {/* Winner */}
            <circle cx="268" cy="92" r="28" fill="rgba(245,214,123,0.06)" />
            <rect x="240" y="78" width="56" height="30" rx="6" fill="rgba(245,214,123,0.1)" stroke="#f5d67b" strokeWidth="1.5" />
            <polygon points="260,86 260,100 274,93" fill="rgba(245,214,123,0.65)" />
            <path d="M255 72 L260 65 L268 72 L276 65 L281 72" stroke="#f5d67b" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
          </svg>
        </div>
      </div>
    ),
    size
  );
}
