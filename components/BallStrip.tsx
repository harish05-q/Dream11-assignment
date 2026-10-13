"use client";

import { scaleLinear } from "d3-scale";
import { useEffect, useRef, useState } from "react";
import type { Ball, Moment } from "@/lib/types";

const colors: Record<Ball["outcome"], string> = {
  dot: "var(--dot)",
  runs: "var(--paper-muted)",
  boundary: "var(--boundary)",
  wicket: "var(--wicket)",
  extra: "#bcc2ae",
};

export function BallStrip({
  balls,
  moments,
  selectedId,
  selectedIndex,
  onSelect,
}: {
  balls: Ball[];
  moments: Moment[];
  selectedId: string | null;
  selectedIndex: number;
  onSelect: (momentId: string | null, ballIndex: number) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const scroll = useRef<HTMLDivElement>(null);
  const width = Math.max(640, balls.length * 13) * zoom;
  const scale = scaleLinear()
    .domain([0, Math.max(1, balls.length - 1)])
    .range([20, width - 20]);
  const momentIndices = new Map(
    moments.map((moment) => [moment.ballIndex, moment.id]),
  );
  const chosenIndex = moments.find(
    (moment) => moment.id === selectedId,
  )?.ballIndex;

  useEffect(() => {
    if (chosenIndex === undefined || !scroll.current) return;
    const node = scroll.current;
    const target =
      (chosenIndex / Math.max(1, balls.length - 1)) * node.scrollWidth;
    node.scrollTo({ left: target - node.clientWidth / 2, behavior: "smooth" });
  }, [chosenIndex, balls.length]);

  const onKeyDown = (
    event: React.KeyboardEvent<SVGCircleElement>,
    index: number,
  ) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      const next = document.querySelector<SVGCircleElement>(
        `[data-ball-index="${Math.min(index + 1, balls.length - 1)}"]`,
      );
      next?.focus();
      onSelect(
        momentIndices.get(index + 1) ?? null,
        Math.min(index + 1, balls.length - 1),
      );
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      const nextIndex = Math.max(0, index - 1);
      document
        .querySelector<SVGCircleElement>(`[data-ball-index="${nextIndex}"]`)
        ?.focus();
      onSelect(momentIndices.get(nextIndex) ?? null, nextIndex);
    }
  };

  return (
    <section className="strip-wrap" aria-labelledby="strip-title">
      <div className="strip-heading">
        <h2 id="strip-title">Every ball, in order</h2>
        <div className="strip-controls" aria-label="Ball strip zoom">
          <button
            type="button"
            className="icon-button"
            aria-label="Zoom out"
            onClick={() => setZoom((value) => Math.max(0.7, value - 0.2))}
          >
            −
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Zoom in"
            onClick={() => setZoom((value) => Math.min(2, value + 0.2))}
          >
            +
          </button>
        </div>
      </div>
      <div
        className="ball-strip-scroll"
        ref={scroll}
        tabIndex={0}
        aria-label="Scrollable ball-by-ball timeline"
      >
        <svg
          className="ball-strip"
          style={{ width }}
          viewBox={`0 0 ${width} 105`}
          role="group"
          aria-label="Match ball strip. Use arrow keys to move between deliveries."
        >
          <line
            x1="20"
            x2={width - 20}
            y1="47"
            y2="47"
            stroke="var(--line)"
            strokeWidth="1"
          />
          {balls.map((ball, index) => {
            const x = scale(index);
            const isSelected = index === selectedIndex;
            const moment = momentIndices.has(index);
            return (
              <g key={ball.id}>
                {moment && (
                  <line
                    x1={x}
                    x2={x}
                    y1="11"
                    y2="79"
                    stroke="var(--acid)"
                    strokeOpacity=".45"
                    strokeDasharray="2 4"
                  />
                )}
                {(index === 0 ||
                  balls[index - 1].over !== ball.over ||
                  balls[index - 1].innings !== ball.innings) &&
                  index !== 0 && (
                    <line
                      x1={x - 5}
                      x2={x - 5}
                      y1="25"
                      y2="74"
                      stroke="var(--line)"
                      strokeWidth="1"
                    />
                  )}
                <circle
                  data-ball-index={index}
                  className={`strip-ball${isSelected ? " selected" : ""}`}
                  cx={x}
                  cy={47 - Math.min(19, ball.total * 2.4)}
                  r={
                    ball.wicket
                      ? 7
                      : ball.outcome === "boundary"
                        ? 5.6
                        : ball.total
                          ? 4
                          : 3.2
                  }
                  fill={colors[ball.outcome]}
                  role="button"
                  tabIndex={index === selectedIndex ? 0 : -1}
                  aria-label={`${ball.innings === 1 ? "First" : "Second"} innings, ${ball.over + 1}.${ball.ball}: ${ball.batter} faced ${ball.bowler}, ${ball.total} runs${ball.wicket ? `, wicket ${ball.wicket}` : ""}, score ${ball.score} for ${ball.wickets}`}
                  aria-pressed={isSelected}
                  onFocus={() =>
                    onSelect(momentIndices.get(index) ?? null, index)
                  }
                  onClick={() =>
                    onSelect(momentIndices.get(index) ?? null, index)
                  }
                  onKeyDown={(event) => onKeyDown(event, index)}
                >
                  <title>{`${ball.over + 1}.${ball.ball} ${ball.batterRuns}${ball.wicket ? ` · wicket ${ball.wicket}` : ""} · ${ball.score}/${ball.wickets}`}</title>
                </circle>
                {(index === 0 ||
                  balls[index - 1].over !== ball.over ||
                  balls[index - 1].innings !== ball.innings) && (
                  <text
                    x={x}
                    y="96"
                    textAnchor="middle"
                    className="strip-label"
                  >
                    {ball.innings}.{ball.over + 1}
                  </text>
                )}
                {moment && <circle cx={x} cy="14" r="2.5" fill="var(--acid)" />}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="strip-legend" aria-label="Ball outcome key">
        {(["dot", "runs", "boundary", "wicket", "extra"] as const).map(
          (outcome) => (
            <span className="legend-item" key={outcome}>
              <i
                className="legend-dot"
                style={{ background: colors[outcome] }}
              />
              {outcome}
            </span>
          ),
        )}
        <span className="legend-item">
          <i className="legend-dot" style={{ background: "var(--acid)" }} />
          moment
        </span>
      </div>
    </section>
  );
}
