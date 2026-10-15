import { ImageResponse } from "next/og";

import { siteName, siteTitle, siteUrl } from "@/lib/seo";

export const alt = siteTitle;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Brand colors lifted from the app theme (`--nb-primary`, dark surface). */
const BRAND_BACKGROUND = "#1a1917";
const BRAND_PRIMARY = "#ff5e1f";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          position: "relative",
          backgroundColor: BRAND_BACKGROUND,
          backgroundImage: `radial-gradient(circle at 85% 15%, ${BRAND_PRIMARY}33, transparent 55%)`,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: BRAND_PRIMARY,
              color: "white",
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            Z
          </div>
          <div style={{ fontSize: 40, color: "white", fontWeight: 600, letterSpacing: -1 }}>
            {siteName}
          </div>
        </div>

        <div
          style={{
            marginTop: 48,
            display: "flex",
            flexDirection: "column",
            fontSize: 72,
            color: "white",
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: -2,
          }}
        >
          Know what your subscriptions
          <br />
          really cost
        </div>

        <div style={{ marginTop: 28, fontSize: 32, color: "rgba(255,255,255,0.72)" }}>
          Renewal reminders · Normalised monthly cost · Spending analytics
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 56,
            left: 80,
            display: "flex",
            fontSize: 26,
            color: BRAND_PRIMARY,
          }}
        >
          {new URL(siteUrl).host}
        </div>
      </div>
    ),
    { ...size },
  );
}
