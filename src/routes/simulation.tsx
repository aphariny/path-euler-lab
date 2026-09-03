import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Play, RotateCcw } from "lucide-react";
import {
  DEFAULT_PARAMS,
  KP,
  OMEGA_MAX,
  solveModifiedEulerNavigation,
  validateParams,
  type SimParams,
} from "@/lib/solver";
import { setSimParams, useSimParams } from "@/lib/sim-store";
import { TrajectoryChart } from "@/components/TrajectoryChart";
import { FormulaCard, MetricCard, Panel, SectionHeading, WhatIsHappening, fmt } from "@/components/ui-blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/simulation")({
  head: () => ({
    meta: [
      { title: "Simulation — Modified Euler Robot Path Tracking" },
      {
        name: "description",
        content:
          "Enter robot parameters and run a live Modified Euler midpoint simulation with trajectory plot and full numerical results table.",
      },
      { property: "og:title", content: "Simulation — Modified Euler Robot Path Tracking" },
      {
        property: "og:description",
        content: "Run a live Modified Euler midpoint simulation of 2D robot motion in the browser.",
      },
    ],
  }),
  component: SimulationPage,
});

const FIELDS: { key: keyof SimParams; label: string; unit: string; step: number }[] = [
  { key: "x0", label: "Initial X position", unit: "m", step: 0.1 },
  { key: "y0", label: "Initial Y position", unit: "m", step: 0.1 },
  { key: "theta0", label: "Initial angle θ", unit: "rad", step: 0.1 },
  { key: "v", label: "Linear velocity v", unit: "m/s", step: 0.1 },
  { key: "h", label: "Step size h", unit: "s", step: 0.01 },
  { key: "tTotal", label: "Total simulation time", unit: "s", step: 1 },
  { key: "targetX", label: "Target X", unit: "m", step: 0.1 },
  { key: "targetY", label: "Target Y", unit: "m", step: 0.1 },
  { key: "tolerance", label: "Target tolerance", unit: "m", step: 0.05 },
];

function SimulationPage() {
  const active = useSimParams();
  const [draft, setDraft] = useState<Record<keyof SimParams, string>>(() =>
    Object.fromEntries(Object.entries(active).map(([k, v]) => [k, String(v)])) as Record<
      keyof SimParams,
      string
    >,
  );
  const [errors, setErrors] = useState<Partial<Record<keyof SimParams, string>>>({});
  const [running, setRunning] = useState(false);

  const nav = useMemo(() => solveModifiedEulerNavigation(active), [active]);
  const rows = nav.rows;
  const last = rows[rows.length - 1]!;


  const parsed = (): SimParams =>
    Object.fromEntries(
      Object.entries(draft).map(([k, v]) => [k, v.trim() === "" ? NaN : Number(v)]),
    ) as unknown as SimParams;

  function run() {
    const p = parsed();
    const { ok, errors: errs } = validateParams(p);
    setErrors(errs);
    if (!ok) return;
    setRunning(true);
    window.setTimeout(() => {
      setSimParams(p);
      setRunning(false);
    }, 250);
  }

  function reset() {
    setDraft(
      Object.fromEntries(Object.entries(DEFAULT_PARAMS).map(([k, v]) => [k, String(v)])) as Record<
        keyof SimParams,
        string
      >,
    );
    setErrors({});
    setSimParams({ ...DEFAULT_PARAMS });
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Simulation laboratory"
        title="Robot trajectory simulation"
        description="Every value below is computed live in the browser with the Modified Euler midpoint method — nothing is pre-computed."
      />

      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <div className="space-y-6">
          <Panel title="Parameters" subtitle="Initial state and numerical settings">
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

          <WhatIsHappening>
            At every step the robot measures the heading error toward the target, converts it into a
            turning rate ω = Kp·error (clamped), and advances with the Modified Euler midpoint
            update. Kp = {KP}, ω_max = {OMEGA_MAX} rad/s.
          </WhatIsHappening>

          <Panel title="Navigation + update formula">
            <FormulaCard
              lines={[
                "θ_target = atan2(y_t − yₙ, x_t − xₙ)",
                "e = atan2(sin(θ_target − θₙ), cos(θ_target − θₙ))",
                "ωₙ = clamp(Kp·e, −ω_max, ω_max)",
                "θ_mid = θₙ + (h/2)·ωₙ",
                "xₙ₊₁ = xₙ + h·v·cos(θ_mid)",
                "yₙ₊₁ = yₙ + h·v·sin(θ_mid)",
                "θₙ₊₁ = θₙ + h·ωₙ",
              ]}
            />
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Trajectory (X–Y plane)" subtitle="Target-based Modified Euler navigation">
            <TrajectoryChart
              numeric={rows}
              target={{ x: active.targetX, y: active.targetY }}
            />
          </Panel>

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-4">
            <MetricCard label="Final position" value={`(${fmt(last.x)}, ${fmt(last.y)}) m`} />
            <MetricCard label="Final heading θ" value={`${fmt(last.theta)} rad`} />
            <MetricCard
              label="Distance to target"
              value={`${fmt(nav.finalDistance)} m`}
              hint={`tolerance = ${active.tolerance} m`}
            />
            <MetricCard label="Minimum distance" value={`${fmt(nav.minDistance)} m`} />
            <MetricCard
              label="Target reached"
              value={nav.targetReached ? "Yes" : "No"}
              hint={nav.reachedAtTime !== null ? `at t = ${fmt(nav.reachedAtTime, 2)} s` : `within T = ${active.tTotal} s`}
            />
            <MetricCard label="Target position" value={`(${fmt(active.targetX)}, ${fmt(active.targetY)}) m`} />
            <MetricCard label="Start position" value={`(${fmt(active.x0)}, ${fmt(active.y0)}) m`} />
            <MetricCard label="Time steps" value={rows.length - 1} hint={`h = ${active.h}`} />
          </div>

          <Panel title="Numerical results" subtitle={`${rows.length} computed states (scroll for all rows)`} bodyClassName="p-0">
            <div className="max-h-[460px] overflow-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-secondary">
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium">Step</th>
                    <th className="px-4 py-2.5 font-medium">Time (s)</th>
                    <th className="px-4 py-2.5 font-medium">X (m)</th>
                    <th className="px-4 py-2.5 font-medium">Y (m)</th>
                    <th className="px-4 py-2.5 font-medium">θ (rad)</th>
                    <th className="px-4 py-2.5 font-medium">ω (rad/s)</th>
                    <th className="px-4 py-2.5 font-medium">Distance (m)</th>
                  </tr>
                </thead>
                <tbody className="formula">
                  {rows.map((r, i) => {
                    const edge = i === 0 || i === rows.length - 1;
                    return (
                      <tr
                        key={r.step}
                        className={
                          edge
                            ? "bg-accent/60 font-semibold text-foreground"
                            : "border-t border-border/70 text-foreground/85"
                        }
                      >
                        <td className="px-4 py-2">{r.step}</td>
                        <td className="px-4 py-2">{r.t.toFixed(3)}</td>
                        <td className="px-4 py-2">{r.x.toFixed(6)}</td>
                        <td className="px-4 py-2">{r.y.toFixed(6)}</td>
                        <td className="px-4 py-2">{r.theta.toFixed(6)}</td>
                        <td className="px-4 py-2">{r.omega.toFixed(6)}</td>
                        <td className="px-4 py-2">{r.distance.toFixed(6)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>

        </div>
      </div>
    </div>
  );
}
