import { useEffect, useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Customized,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Minus, Pause, Play, Plus, RotateCcw } from "lucide-react";
import type { StateRow } from "@/lib/solver";
import { Button } from "@/components/ui/button";

interface Props {
  numeric: StateRow[];
  exact?: StateRow[];
  showExact?: boolean;
  target?: { x: number; y: number } | null;
}

/** Number of heading arrows drawn along the path. */
const ARROW_COUNT = 14;

type ScaleFn = (v: number) => number;

interface OverlayProps {
  rows: StateRow[];
  arrowIdx: number[];
  robotIdx: number;
  xAxisMap?: Record<string, { scale: ScaleFn }>;
  yAxisMap?: Record<string, { scale: ScaleFn }>;
}

/** Draws heading arrows (from the solver's theta) and the oriented robot marker. */
function HeadingOverlay(props: OverlayProps) {
  const { rows, arrowIdx, robotIdx, xAxisMap, yAxisMap } = props;
  const xScale = xAxisMap ? Object.values(xAxisMap)[0]?.scale : undefined;
  const yScale = yAxisMap ? Object.values(yAxisMap)[0]?.scale : undefined;
  if (!xScale || !yScale) return null;

  const arrowPx = 22;

  const arrows = arrowIdx.map((i) => {
    const r = rows[i]!;
    const px = xScale(r.x);
    const py = yScale(r.y);
    // theta is in world coords (y up); screen y is flipped.
    const deg = (-r.theta * 180) / Math.PI;
    return (
      <g key={`a-${i}`} transform={`translate(${px}, ${py}) rotate(${deg})`} opacity={0.85}>
        <line x1={0} y1={0} x2={arrowPx} y2={0} stroke="var(--color-accent-cyan)" strokeWidth={1.6} />
        <polygon points={`${arrowPx},0 ${arrowPx - 6},-3.6 ${arrowPx - 6},3.6`} fill="var(--color-accent-cyan)" />
      </g>
    );
  });

  const robot = rows[robotIdx]!;
  const rx = xScale(robot.x);
  const ry = yScale(robot.y);
  const rdeg = (-robot.theta * 180) / Math.PI;

  return (
    <g>
      {arrows}
      <g transform={`translate(${rx}, ${ry}) rotate(${rdeg})`}>
        <circle r={11} fill="var(--color-chart-1)" opacity={0.14} />
        <polygon
          points="13,0 -7,-8 -3.5,0 -7,8"
          fill="var(--color-chart-1)"
          stroke="var(--color-card)"
          strokeWidth={1.2}
        />
      </g>
    </g>
  );
}

export function TrajectoryChart({ numeric, exact, showExact = false, target = null }: Props) {
  const [zoom, setZoom] = useState(1);
  const [frame, setFrame] = useState(numeric.length - 1);
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);

  // Reset playback whenever a new simulation is computed.
  useEffect(() => {
    setFrame(numeric.length - 1);
    setPlaying(false);
  }, [numeric]);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const stepMs = Math.max(16, 4000 / Math.max(numeric.length, 1));
    const tick = (now: number) => {
      if (now - last >= stepMs) {
        last = now;
        setFrame((f) => {
          if (f >= numeric.length - 1) {
            setPlaying(false);
            return f;
          }
          return f + 1;
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, numeric.length]);

  const { data, domainX, domainY, last, first, arrowIdx } = useMemo(() => {
    const data = numeric.map((r, i) => ({
      x: r.x,
      y: r.y,
      yExact: exact?.[i]?.y,
      xExact: exact?.[i]?.x,
      t: r.t,
      theta: r.theta,
    }));
    const xs = numeric.map((r) => r.x).concat(target ? [target.x] : []);
    const ys = numeric.map((r) => r.y).concat(target ? [target.y] : []);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const span = Math.max(maxX - minX, maxY - minY, 1) * 0.6;
    const half = span / zoom;
    const n = numeric.length;
    const count = Math.min(ARROW_COUNT, n);
    const arrowIdx = Array.from({ length: count }, (_, k) =>
      Math.round((k * (n - 1)) / Math.max(count - 1, 1)),
    ).filter((v, i, arr) => arr.indexOf(v) === i);
    return {
      data,
      domainX: [cx - half, cx + half] as [number, number],
      domainY: [cy - half, cy + half] as [number, number],
      first: numeric[0]!,
      last: numeric[numeric.length - 1]!,
      arrowIdx,
    };
  }, [numeric, exact, target, zoom]);

  const robotIdx = Math.min(Math.max(frame, 0), numeric.length - 1);
  const robot = numeric[robotIdx]!;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (!playing && robotIdx >= numeric.length - 1) setFrame(0);
              setPlaying((p) => !p);
            }}
          >
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
            {playing ? "Pause" : "Animate robot"}
          </Button>
          <input
            type="range"
            min={0}
            max={Math.max(numeric.length - 1, 0)}
            value={robotIdx}
            aria-label="Scrub trajectory"
            onChange={(e) => {
              setPlaying(false);
              setFrame(Number(e.target.value));
            }}
            className="h-1.5 w-40 cursor-pointer accent-[var(--color-chart-1)]"
          />
          <span className="formula text-xs text-muted-foreground">
            t = {robot.t.toFixed(2)} s · θ = {robot.theta.toFixed(3)} rad
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(z * 1.25, 12))}>
            <Plus className="size-4" />
          </Button>
          <Button variant="outline" size="icon" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(z / 1.25, 0.2))}>
            <Minus className="size-4" />
          </Button>
          <Button variant="outline" size="icon" aria-label="Reset view" onClick={() => setZoom(1)}>
            <RotateCcw className="size-4" />
          </Button>
        </div>
      </div>
      <div className="h-[440px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 24, bottom: 28, left: 8 }}>
            <CartesianGrid stroke="var(--color-grid-line)" strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="x"
              domain={domainX}
              allowDataOverflow
              tickFormatter={(v: number) => v.toFixed(1)}
              stroke="var(--color-muted-foreground)"
              tick={{ fontSize: 11 }}
              label={{ value: "X Position (m)", position: "insideBottom", offset: -16, fontSize: 12 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={domainY}
              allowDataOverflow
              tickFormatter={(v: number) => v.toFixed(1)}
              stroke="var(--color-muted-foreground)"
              tick={{ fontSize: 11 }}
              label={{ value: "Y Position (m)", angle: -90, position: "insideLeft", fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--color-border)",
                background: "var(--color-card)",
                fontSize: 12,
              }}
              formatter={(value: number, name: string) => [Number(value).toFixed(4), name]}
              labelFormatter={() => ""}
            />
            <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="y"
              name="Modified Euler trajectory"
              stroke="var(--color-chart-1)"
              strokeWidth={2.2}
              dot={false}
              isAnimationActive={false}
            />
            {showExact && exact ? (
              <Line
                type="monotone"
                dataKey="yExact"
                name="Analytical reference"
                stroke="var(--color-chart-3)"
                strokeDasharray="5 4"
                strokeWidth={1.8}
                dot={false}
                isAnimationActive={false}
              />
            ) : null}
            <ReferenceDot x={first.x} y={first.y} r={6} fill="var(--color-success)" stroke="none" />
            <ReferenceDot x={last.x} y={last.y} r={6} fill="var(--color-chart-1)" stroke="none" />
            {target ? (
              <ReferenceDot
                x={target.x}
                y={target.y}
                r={6}
                fill="none"
                stroke="var(--color-chart-5)"
                strokeWidth={2}
                label={{ value: "target", fontSize: 10, position: "top" }}
              />
            ) : null}
            <Customized
              {...({
                component: (p: OverlayProps) => (
                  <HeadingOverlay {...p} rows={numeric} arrowIdx={arrowIdx} robotIdx={robotIdx} />
                ),
              } as never)}
            />

          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-success" /> Start ({first.x.toFixed(2)}, {first.y.toFixed(2)})
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-chart-1" /> Final ({last.x.toFixed(2)}, {last.y.toFixed(2)})
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-accent-cyan" /> Heading arrows use computed θ (final θ ={" "}
          {last.theta.toFixed(3)} rad)
        </span>
      </div>
    </div>
  );
}
