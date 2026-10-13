import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllMomentParams, getMatch } from "@/lib/data";

export async function generateStaticParams() {
  return getAllMomentParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; moment: string }>;
}): Promise<Metadata> {
  const { id, moment: momentId } = await params;
  const match = await getMatch(id);
  const moment = match?.analysis.moments.find((item) => item.id === momentId);
  if (!match || !moment) return { title: "Moment not found" };
  return {
    title: `${moment.title} · ${match.info.teams.join(" v ")}`,
    description: `${moment.summary} From the ${match.info.date} IPL scorecard, with facts separated from likely reasoning.`,
    openGraph: {
      title: `${moment.title} · WhyThisMoment`,
      description: moment.summary,
      images: [`/share/${id}/${momentId}/opengraph-image`],
      type: "article",
    },
  };
}

export default async function SharedMomentPage({
  params,
}: {
  params: Promise<{ id: string; moment: string }>;
}) {
  const { id, moment: momentId } = await params;
  const match = await getMatch(id);
  const moment = match?.analysis.moments.find((item) => item.id === momentId);
  if (!match || !moment) notFound();
  const deepLink = `/match/${id}?moment=${moment.id}`;
  return (
    <main className="site-shell error-page" id="main-content">
      <div className="eyebrow">
        A moment from the IPL archive · {moment.innings}.{moment.over + 1}.
        {moment.ball}
      </div>
      <h1>{moment.title}</h1>
      <p>
        {match.info.teams.join(" v ")} · {match.info.date} · {match.info.result}
      </p>
      <p className="prose-lede">{moment.summary}</p>
      <Link className="button" href={deepLink}>
        Open the ball-by-ball replay
      </Link>
      <p
        className="muted"
        style={{ font: ".7rem var(--mono)", marginTop: "1.2rem" }}
      >
        The replay opens on this moment. Match facts come from Cricsheet
        ball-by-ball data.
      </p>
    </main>
  );
}
