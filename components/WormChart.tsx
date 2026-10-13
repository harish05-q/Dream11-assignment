"use client";

import { scaleLinear } from "d3-scale";
import { bisectLeft } from "d3-array";
import { interpolateNumber } from "d3-interpolate";
import { curveMonotoneX, line } from "d3-shape";
import { motion, useReducedMotion } from "framer-motion";
import type { AnalyzedMatch, Ball, Moment } from "@/lib/types";

const width = 720;
const height = 180;
const inset = { top: 10, right: 12, bottom: 27, left: 35 };

export function WormChart({
  points,
  moments,
  selectedId,
  activeBall,
  firstTeam,
  onSelect,
}: {
  points: AnalyzedMatch["winProbability"];
  moments: Moment[];
  selectedId: string | null;
  activeBall: Ball | null;
  firstTeam: string;
  onSelect: (id: string) => void;
}) {
  const reduceMotion = useReducedMotion();
  const position = (innings: number, over: number) =>
    over + (innings === 2 ? 20 : 0);
  const maxOver = Math.max(
    40,
    ...points.map((point) => position(point.innings, point.over)),
  );
  const x = scaleLinear()
    .domain([0, maxOver])
    .range([inset.left, width - inset.right]);
  const y = scaleLinear()
    .domain([0, 1])
    .range([height - inset.bottom, inset.top]);
  const lineGenerator = line<AnalyzedMatch["winProbability"][number]>()
    .x((point) => x(position(point.innings, point.over)))
    .y((point) => y(point.probability))
    .curve(curveMonotoneX);
  const probabilityAt = (innings: number, over: number) => {
    const current = points
      .filter((point) => point.innings === innings)
      .sort((a, b) => a.over - b.over);
    if (!current.length) return null;
    const times = current.map((point) => point.over);
    const afterIndex = bisectLeft(times, over);
    const before = current[Math.max(0, afterIndex - 1)];
    const after = current[Math.min(current.length - 1, afterIndex)];
    if (before.over === after.over) return before.probability;
    const progress = Math.max(
      0,
      Math.min(1, (over - before.over) / (after.over - before.over)),
    );
    return interpolateNumber(before.probability, after.probability)(progress);
  };

  return (
    <section className="worm-section" aria-labelledby="worm-title">
      <div className="worm-title">
        <h2 id="worm-title">
          {firstTeam} win probability <span className="muted">— estimate</span>
        </h2>
        <span>MODELLED FROM SCORE · WICKETS · BALLS LEFT</span>
      </div>
      <svg
        className="worm-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="group"
        aria-label="Estimated win probability changes through the match. This is a model, not an official odds feed."
      >
        {[0.25, 0.5, 0.75].map((value) => (
          <g key={value}>
            <line
              className="worm-grid"
              x1={inset.left}
              x2={width - inset.right}
              y1={y(value)}
              y2={y(value)}
            />
            <text className="worm-axis" x="0" y={y(value) + 3}>
              {Math.round(value * 100)}%
            </text>
          </g>
        ))}
        {Array.from(
          { length: Math.floor(maxOver / 5) + 1 },
          (_, i) => i * 5,
        ).map((over) => (
          <text
            className="worm-axis"
            key={over}
            x={x(over)}
            y={height - 6}
            textAnchor="middle"
          >
            {over === 20
              ? "innings"
              : `${over < 20 ? "1st" : "2nd"} · ${over % 20} ov`}
          </text>
        ))}
        {[1, 2].map((innings) => {
          const current = points.filter((point) => point.innings === innings);
          return (
            <path
              key={innings}
              className="worm-line"
              d={lineGenerator(current) ?? ""}
              strokeDasharray={innings === 1 ? "5 4" : undefined}
              opacity={innings === 1 ? 0.58 : 1}
            />
          );
        })}
        {moments.map((moment) => {
          const time = moment.over + moment.ball / 6;
          const probability = probabilityAt(moment.innings, time);
          if (probability === null) return null;
          return (
            <circle
              key={moment.id}
              className="worm-marker"
              cx={x(position(moment.innings, time))}
              cy={y(probability)}
              r={moment.id === selectedId ? 6 : 4}
              onClick={() => onSelect(moment.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ")
                  onSelect(moment.id);
              }}
              role="button"
              tabIndex={0}
              aria-label={`Jump to ${moment.title} at over ${moment.over + 1}`}
            >
              <title>{moment.title}</title>
            </circle>
          );
        })}
        {activeBall &&
          (() => {
            const time = activeBall.over + activeBall.ball / 6;
            const probability = probabilityAt(activeBall.innings, time);
            if (probability === null) return null;
            const cx = x(position(activeBall.innings, time));
            const cy = y(probability);
            return (
              <motion.circle
                cx={cx}
                cy={cy}
                r="4"
                fill="var(--acid)"
                stroke="var(--ink)"
                strokeWidth="2"
                aria-hidden="true"
                initial={false}
                animate={{ cx, cy }}
                transition={{
                  duration: reduceMotion ? 0 : 0.32,
                  ease: "easeOut",
                }}
              />
            );
          })()}
      </svg>
      <p className="muted" style={{ margin: 0, font: ".68rem var(--mono)" }}>
        Not a prediction. A simple estimate; methodology on{" "}
        <a className="small-link" href="/method">
          the method page
        </a>
        .
      </p>
    </section>
  );
}
