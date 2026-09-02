import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { Minus, Plus, RotateCcw } from "lucide-react";
import type { StateRow } from "@/lib/solver";
import { Button } from "@/components/ui/button";

interface Props {
  rows: StateRow[];
  desired: { x: number; y: number }[];
}

export function TrajectoryChart({ rows, desired }: Props) {
  const [zoom, setZoom] = useState(1);

  const { actual, domainX, domainY, first, last } = useMemo(() => {
    const actual = rows.map((r) => ({ x: r.x, y: r.y }));
    const xs = actual.map((p) => p.x).concat(desired.map((p) => p.x));
    const ys = actual.map((p) => p.y).concat(desired.map((p) => p.y));
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const half = (Math.max(maxX - minX, maxY - minY, 1) * 0.6) / zoom;
    return {
      actual,
      domainX: [cx - half, cx + half] as [number, number],
      domainY: [cy - half, cy + half] as [number, number],
      first: rows[0]!,
      last: rows[rows.length - 1]!,
    };
  }, [rows, desired, zoom]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">
          Robot Path Tracking using Modified Euler Method
        </p>
        <div className="flex gap-2">
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
          <ScatterChart margin={{ top: 12, right: 24, bottom: 28, left: 8 }}>
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
            <ZAxis range={[24, 24]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--color-border)",
                background: "var(--color-card)",
                fontSize: 12,
              }}
              formatter={(value: number, name: string) => [Number(value).toFixed(4), name]}
            />
            <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: 12 }} />
            <Scatter
              name="Desired path"
              data={desired}
              line={{ stroke: "var(--color-chart-3)", strokeWidth: 1.8, strokeDasharray: "6 4" }}
              lineJointType="monotoneX"
              shape={() => <g />}
              legendType="line"
              isAnimationActive={false}
            />
            <Scatter
              name="Modified Euler robot trajectory"
              data={actual}
              line={{ stroke: "var(--color-chart-1)", strokeWidth: 2.2 }}
              lineJointType="monotoneX"
              shape={() => <g />}
              legendType="line"
              isAnimationActive={false}
            />
            <Scatter
              name="Initial position"
              data={[{ x: first.x, y: first.y }]}
              fill="var(--color-success)"
              isAnimationActive={false}
            />
            <Scatter
              name="Final robot position"
              data={[{ x: last.x, y: last.y }]}
              fill="var(--color-chart-5)"
              isAnimationActive={false}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-success" /> Initial ({first.x.toFixed(2)}, {first.y.toFixed(2)})
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-chart-5" /> Final ({last.x.toFixed(2)}, {last.y.toFixed(2)})
        </span>
        <span className="inline-flex items-center gap-1.5">
          θ = {last.theta.toFixed(3)} rad · v = {last.v.toFixed(3)} m/s · ω = {last.omega.toFixed(3)} rad/s
        </span>
      </div>
    </div>
  );
}
