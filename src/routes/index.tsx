import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Play, RotateCcw } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DEFAULT_PARAMS,
  computeErrorStats,
  desiredPath,
  simulateTracking,
  validateParams,
  type SimParams,
} from "@/lib/solver";
import { TrajectoryChart } from "@/components/TrajectoryChart";
import { MetricCard, Panel, SectionHeading, fmt } from "@/components/ui-blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Robot Path Tracking using the Modified Euler Method" },
      {
        name: "description",
        content:
          "Feedback path-tracking simulation of a 2D robot integrated with the Modified Euler predictor-corrector method, with live trajectory and tracking-error analysis.",
      },
      { property: "og:title", content: "Robot Path Tracking using the Modified Euler Method" },
      {
        property: "og:description",
        content:
          "Interactive numerical-methods capstone: feedback controller + Modified Euler integration with tracking-error analysis.",
      },
    ],
  }),
  component: AppPage,
});

const FIELDS: { key: keyof SimParams; label: string; unit: string; step: number }[] = [
  { key: "x0", label: "Initial X position", unit: "m", step: 0.1 },
  { key: "y0", label: "Initial Y position", unit: "m", step: 0.1 },
  { key: "theta0", label: "Initial angle θ", unit: "rad", step: 0.1 },
  { key: "vd", label: "Desired linear velocity vd", unit: "m/s", step: 0.1 },
  { key: "omegad", label: "Desired angular velocity ωd", unit: "rad/s", step: 0.05 },
  { key: "h", label: "Step size h", unit: "s", step: 0.01 },
  { key: "tTotal", label: "Total simulation time", unit: "s", step: 1 },
  { key: "R", label: "Desired path radius R", unit: "m", step: 0.5 },
  { key: "omegap", label: "Desired path angular velocity ωp", unit: "rad/s", step: 0.05 },
  { key: "kx", label: "Controller gain kx", unit: "—", step: 0.1 },
  { key: "ky", label: "Controller gain ky", unit: "—", step: 0.1 },
  { key: "ktheta", label: "Controller gain kθ", unit: "—", step: 0.1 },
];

type Draft = Record<keyof SimParams, string>;

const toDraft = (p: SimParams): Draft =>
  Object.fromEntries(Object.entries(p).map(([k, v]) => [k, String(v)])) as Draft;

function AppPage() {
  const [active, setActive] = useState<SimParams>({ ...DEFAULT_PARAMS });
  const [draft, setDraft] = useState<Draft>(() => toDraft(DEFAULT_PARAMS));
  const [errors, setErrors] = useState<Partial<Record<keyof SimParams, string>>>({});
  const [running, setRunning] = useState(false);

  const rows = useMemo(() => simulateTracking(active), [active]);
  const path = useMemo(() => desiredPath(active), [active]);
  const stats = useMemo(() => computeErrorStats(rows), [rows]);
  const errorSeries = useMemo(
    () => rows.map((r) => ({ t: Number(r.t.toFixed(3)), e: r.e })),
    [rows],
  );

  function run() {
    const p = Object.fromEntries(
      Object.entries(draft).map(([k, v]) => [k, v.trim() === "" ? NaN : Number(v)]),
    ) as unknown as SimParams;
    const { ok, errors: errs } = validateParams(p);
    setErrors(errs);
    if (!ok) return;
    setRunning(true);
    window.setTimeout(() => {
      setActive(p);
      setRunning(false);
    }, 200);
  }

  function reset() {
    setDraft(toDraft(DEFAULT_PARAMS));
    setErrors({});
    setActive({ ...DEFAULT_PARAMS });
  }

  return (
    <div className="space-y-10">
      <section id="input" className="space-y-6">
        <SectionHeading
          eyebrow="Input"
          title="Simulation and controller parameters"
          description="All results are computed live in the browser from these values."
        />
        <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
          <Panel title="Parameters" subtitle="Initial state, reference inputs and controller gains">
            <div className="space-y-4">
              {FIELDS.map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <Label htmlFor={f.key} className="text-xs text-muted-foreground">
                    {f.label} <span className="formula">({f.unit})</span>
                  </Label>
                  <Input
                    id={f.key}
                    type="number"
                    step={f.step}
                    className="formula"
                    value={draft[f.key]}
                    aria-invalid={Boolean(errors[f.key])}
                    onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                  />
                  {errors[f.key] ? (
                    <p className="text-xs font-medium text-destructive">{errors[f.key]}</p>
                  ) : null}
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <Button className="flex-1" onClick={run} disabled={running}>
                  {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
                  {running ? "Computing…" : "Run Simulation"}
                </Button>
                <Button variant="outline" onClick={reset} aria-label="Reset parameters">
                  <RotateCcw className="size-4" />
                  Reset
                </Button>
              </div>
            </div>
          </Panel>

          <div className="space-y-6">
            <section id="simulation" className="space-y-4">
              <SectionHeading eyebrow="Simulation" title="Robot Path Tracking using Modified Euler Method" />
              <Panel title="Trajectory (X–Y plane)" subtitle="Feedback controller integrated with the Modified Euler predictor–corrector">
                <TrajectoryChart rows={rows} desired={path} />
              </Panel>
              <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-4">
                <MetricCard label="Final X" value={`${fmt(rows[rows.length - 1]!.x)} m`} />
                <MetricCard label="Final Y" value={`${fmt(rows[rows.length - 1]!.y)} m`} />
                <MetricCard label="Final θ" value={`${fmt(rows[rows.length - 1]!.theta)} rad`} />
                <MetricCard label="Time steps" value={rows.length - 1} hint={`h = ${active.h} s`} />
              </div>
            </section>
          </div>
        </div>
      </section>

      <section id="error-analysis" className="space-y-6">
        <SectionHeading
          eyebrow="Error analysis"
          title="Tracking Error vs Time"
          description="e(t) = √((xd − x)² + (yd − y)²), evaluated at every simulation timestep."
        />
        <Panel title="Tracking Error vs Time">
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={errorSeries} margin={{ top: 12, right: 24, bottom: 24, left: 8 }}>
                <CartesianGrid stroke="var(--color-grid-line)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="t"
                  stroke="var(--color-muted-foreground)"
                  tick={{ fontSize: 11 }}
                  label={{ value: "Time (s)", position: "insideBottom", offset: -14, fontSize: 12 }}
                />
                <YAxis
                  stroke="var(--color-muted-foreground)"
                  tick={{ fontSize: 11 }}
                  width={72}
                  tickFormatter={(v: number) => v.toFixed(2)}
                  label={{ value: "Tracking error (m)", angle: -90, position: "insideLeft", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [Number(v).toFixed(6), "e(t)"]}
                  labelFormatter={(l) => `t = ${l} s`}
                />
                <Line
                  type="monotone"
                  dataKey="e"
                  name="Tracking error"
                  stroke="var(--color-chart-1)"
                  dot={false}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Final tracking error" value={`${fmt(stats.finalError, 6)} m`} />
          <MetricCard label="Maximum tracking error" value={`${fmt(stats.maxError, 6)} m`} />
          <MetricCard label="Mean tracking error" value={`${fmt(stats.meanError, 6)} m`} />
          <MetricCard label="RMSE tracking error" value={`${fmt(stats.rmse, 6)} m`} />
        </div>
      </section>
    </div>
  );
}
