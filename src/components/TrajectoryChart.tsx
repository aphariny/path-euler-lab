import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Minus, Plus, RotateCcw } from "lucide-react";
import type { StateRow } from "@/lib/solver";
import { Button } from "@/components/ui/button";

interface Props {
  numeric: StateRow[];
  exact?: StateRow[];
  showExact?: boolean;
  target?: { x: number; y: number } | null;
}

export function TrajectoryChart({ numeric, exact, showExact = false, target = null }: Props) {
  const [zoom, setZoom] = useState(1);

  const { data, domainX, domainY, last, first } = useMemo(() => {
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
    return {
      data,
      domainX: [cx - half, cx + half] as [number, number],
      domainY: [cy - half, cy + half] as [number, number],
      first: numeric[0]!,
      last: numeric[numeric.length - 1]!,
    };
  }, [numeric, exact, target, zoom]);

  const arrowLen = (domainX[1] - domainX[0]) * 0.07;
  const arrowEnd = {
    x: last.x + arrowLen * Math.cos(last.theta),
    y: last.y + arrowLen * Math.sin(last.theta),
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
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
            <ReferenceDot
              x={arrowEnd.x}
              y={arrowEnd.y}
              r={3}
              fill="var(--color-accent-cyan)"
              stroke="none"
              label={{ value: "heading", fontSize: 10, position: "right" }}
            />
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
          <span className="size-2.5 rounded-full bg-accent-cyan" /> Heading θ = {last.theta.toFixed(3)} rad
        </span>
      </div>
    </div>
  );
}
