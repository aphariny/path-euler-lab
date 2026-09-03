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
  { key: "omega", label: "Angular velocity ω", unit: "rad/s", step: 0.05 },
  { key: "h", label: "Step size h", unit: "s", step: 0.01 },
  { key: "tTotal", label: "Total simulation time", unit: "s", step: 1 },
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
  const [showExact, setShowExact] = useState(false);

  const rows = useMemo(() => solveModifiedEuler(active), [active]);
  const exact = useMemo(() => analyticalTrajectory(active), [active]);
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
            At each step the method estimates the slope at the midpoint of the interval and uses that
            midpoint slope to obtain a more accurate next position.
          </WhatIsHappening>

          <Panel title="Update formula">
            <FormulaCard
              lines={[
                "θ_mid = θₙ + (h/2)·ω",
                "xₙ₊₁ = xₙ + h·v·cos(θ_mid)",
                "yₙ₊₁ = yₙ + h·v·sin(θ_mid)",
                "θₙ₊₁ = θₙ + h·ω",
              ]}
            />
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel
            title="Trajectory (X–Y plane)"
            subtitle="Modified Euler numerical path"
            action={
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                Analytical overlay
                <Switch checked={showExact} onCheckedChange={setShowExact} />
              </label>
            }
          >
            <TrajectoryChart numeric={rows} exact={exact} showExact={showExact} />
          </Panel>

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
            <MetricCard label="Final X" value={`${fmt(last.x)} m`} />
            <MetricCard label="Final Y" value={`${fmt(last.y)} m`} />
            <MetricCard label="Final θ" value={`${fmt(last.theta)} rad`} />
            <MetricCard label="Simulation time" value={`${fmt(active.tTotal, 2)} s`} />
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
