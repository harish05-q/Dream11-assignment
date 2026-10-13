import { ImageResponse } from "next/og";
import { getMatch } from "@/lib/data";

export const alt = "WhyThisMoment match moment share card";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateStaticParams() {
  const { getAllMomentParams } = await import("@/lib/data");
  return getAllMomentParams();
}

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ id: string; moment: string }>;
}) {
  const { id, moment: momentId } = await params;
  const match = await getMatch(id);
  const moment = match?.analysis.moments.find((item) => item.id === momentId);
  const title = moment?.title ?? "The moment, explained.";
  const teams = match?.info.teams.join("  /  ") ?? "IPL ARCHIVE";
  const momentTime = moment
    ? `INNINGS ${moment.innings}  ·  OVER ${moment.over + 1}.${moment.ball}`
    : "CRICKET · WITH CONTEXT";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "66px 76px",
        backgroundColor: "#101713",
        color: "#f2f0e8",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 22,
          letterSpacing: 3,
          color: "#d5ef58",
        }}
      >
        <span>● WHYTHISMOMENT</span>
        <span style={{ color: "#aaa99f", fontSize: 16 }}>{momentTime}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", color: "#aaa99f", fontSize: 21 }}>
          {teams} · {match?.info.date ?? ""}
        </div>
        <div
          style={{
            maxWidth: 1000,
            fontSize: 76,
            lineHeight: 1.03,
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          {title}
        </div>
        <div style={{ color: "#aaa99f", fontSize: 27 }}>
          {moment?.summary ??
            "A moment in the match, grounded in the scorecard."}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          borderTop: "1px solid #3c4840",
          paddingTop: 20,
          fontSize: 19,
          color: "#aaa99f",
        }}
      >
        <span>CONFIRMED DATA · LIKELY REASONING · WHAT WE CAN’T KNOW</span>
        <span>WHYTHISMOMENT</span>
      </div>
    </div>,
    size,
  );
}
