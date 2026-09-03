import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  analyticalTrajectory,
  computeErrors,
  solveEuler,
  solveModifiedEuler,
  solveModifiedEulerNavigation,
  type SimParams,
} from "@/lib/solver";
import { useSimParams } from "@/lib/sim-store";
import { FormulaCard, MetricCard, Panel, SectionHeading, WhatIsHappening, fmtSci } from "@/components/ui-blocks";

export const Route = createFileRoute("/analysis")({
  head: () => ({
    meta: [
      { title: "Results & Error Analysis — Modified Euler Robot Simulation" },
      {
        name: "description",
        content:
          "Compare the Modified Euler numerical solution with the analytical circular solution, review error metrics, Euler comparison and step-size convergence.",
      },
      { property: "og:title", content: "Results & Error Analysis — Modified Euler Robot Simulation" },
      {
        property: "og:description",
        content: "Error-vs-time graphs, Euler vs Modified Euler comparison and step-size experiments.",
      },
    ],
  }),
  component: AnalysisPage,
});

const STEP_SIZES = [0.5, 0.2, 0.1, 0.05];

function AnalysisPage() {
  const params = useSimParams();
  const nav = useMemo(() => solveModifiedEulerNavigation(params), [params]);



  const { me, eu, meErr, euErr, chartData, stepTable } = useMemo(() => {
    const me = solveModifiedEuler(params);
    const eu = solveEuler(params);
    const meErr = computeErrors(me, params);
    const euErr = computeErrors(eu, params);

    const chartData = meErr.rows.map((r, i) => ({
      t: Number(r.t.toFixed(3)),
      modified: r.errPos,
      euler: euErr.rows[i]?.errPos ?? 0,
      errX: r.errX,
      errY: r.errY,
    }));

    const stepTable = STEP_SIZES.map((h) => {
      const p: SimParams = { ...params, h };
      const rowsMe = solveModifiedEuler(p);
      const rowsEu = solveEuler(p);
      return {
        h,
        steps: rowsMe.length - 1,
        finalMe: computeErrors(rowsMe, p).finalError,
        finalEu: computeErrors(rowsEu, p).finalError,
      };
    });

    return { me, eu, meErr, euErr, chartData, stepTable };
  }, [params]);

  const exact = analyticalTrajectory(params);
  const lastExact = exact[exact.length - 1]!;
  const lastMe = me[me.length - 1]!;
  const lastEu = eu[eu.length - 1]!;

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Results"
        title="Error analysis and method comparison"
        description={`Numerical validation of the Modified Euler method for the CONSTANT-ω reference case (v = ${params.v}, ω = ${params.omega}, h = ${params.h}, T = ${params.tTotal}), where a closed-form analytical solution exists.`}
      />

      <Panel title="Target navigation results" subtitle="Metrics for the dynamic-ω trajectory from the Simulation page">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Target" value={`(${params.targetX}, ${params.targetY}) m`} />
          <MetricCard label="Final distance to target" value={`${nav.finalDistance.toFixed(4)} m`} hint={`tolerance = ${params.tolerance} m`} />
          <MetricCard label="Minimum distance" value={`${nav.minDistance.toFixed(4)} m`} />
          <MetricCard
            label="Target reached"
            value={nav.targetReached ? "Yes" : "No"}
            hint={nav.reachedAtTime !== null ? `at t = ${nav.reachedAtTime.toFixed(2)} s` : "not within T"}
          />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          The navigation run uses a heading-dependent ω, so it has no closed-form analytical solution
          and is evaluated with navigation metrics only. The sections below keep the classical
          constant-ω validation of the numerical methods.
        </p>
      </Panel>


      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Panel title="Analytical reference solution" subtitle="Exact solution for constant v and constant ω">
          <FormulaCard
            lines={[
              "x(t) = x₀ + (v/ω)[ sin(θ₀ + ω t) − sin(θ₀) ]",
              "y(t) = y₀ − (v/ω)[ cos(θ₀ + ω t) − cos(θ₀) ]",
              "θ(t) = θ₀ + ω t",
            ]}
            caption="The exact path is a circle of radius v/ω; it is used as the reference for the error metrics."
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <MetricCard label="Exact final X" value={`${lastExact.x.toFixed(5)} m`} />
            <MetricCard label="Modified Euler X" value={`${lastMe.x.toFixed(5)} m`} />
            <MetricCard label="Basic Euler X" value={`${lastEu.x.toFixed(5)} m`} />
          </div>
        </Panel>
        <WhatIsHappening>
          Position error is the straight-line distance between the numerical point and the exact
          point at the same instant: √((x_num − x_exact)² + (y_num − y_exact)²).
        </WhatIsHappening>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Maximum position error" value={`${fmtSci(meErr.maxError)} m`} hint="Modified Euler" />
        <MetricCard label="Final position error" value={`${fmtSci(meErr.finalError)} m`} hint="Modified Euler" />
        <MetricCard label="Average position error" value={`${fmtSci(meErr.avgError)} m`} hint="Modified Euler" />
      </div>

      <Panel title="Error versus time" subtitle="Absolute X error, absolute Y error and total position error">
        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 12, right: 24, bottom: 24, left: 8 }}>
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
                tickFormatter={(v: number) => v.toExponential(1)}
                width={72}
                label={{ value: "Error (m)", angle: -90, position: "insideLeft", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-card)", fontSize: 12 }}
                formatter={(v: number, n: string) => [Number(v).toExponential(3), n]}
                labelFormatter={(l) => `t = ${l} s`}
              />
              <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="errX" name="|Δx|" stroke="var(--color-chart-2)" dot={false} strokeWidth={1.6} isAnimationActive={false} />
              <Line type="monotone" dataKey="errY" name="|Δy|" stroke="var(--color-chart-5)" dot={false} strokeWidth={1.6} isAnimationActive={false} />
              <Line type="monotone" dataKey="modified" name="Position error" stroke="var(--color-chart-1)" dot={false} strokeWidth={2.2} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel title="Euler vs Modified Euler" subtitle="Same problem, same step size, different update rule">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 font-medium">Method</th>
                <th className="py-2 font-medium">Final error (m)</th>
                <th className="py-2 font-medium">Maximum error (m)</th>
              </tr>
            </thead>
            <tbody className="formula">
              <tr className="border-b border-border/70">
                <td className="py-2.5">Basic Euler</td>
                <td className="py-2.5">{fmtSci(euErr.finalError)}</td>
                <td className="py-2.5">{fmtSci(euErr.maxError)}</td>
              </tr>
              <tr className="bg-accent/60 font-semibold">
                <td className="py-2.5">Modified Euler (midpoint)</td>
                <td className="py-2.5">{fmtSci(meErr.finalError)}</td>
                <td className="py-2.5">{fmtSci(meErr.maxError)}</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            For these parameters the Modified Euler maximum error is{" "}
            <span className="formula font-semibold text-foreground">
              {euErr.maxError > 0 ? `${(euErr.maxError / Math.max(meErr.maxError, 1e-15)).toFixed(1)}×` : "—"}
            </span>{" "}
            smaller than basic Euler, confirming its higher order of accuracy.
          </p>
        </Panel>

        <Panel title="Error comparison graph" subtitle="Position error of both methods over time">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 12, right: 24, bottom: 24, left: 8 }}>
                <CartesianGrid stroke="var(--color-grid-line)" strokeDasharray="3 3" />
                <XAxis dataKey="t" stroke="var(--color-muted-foreground)" tick={{ fontSize: 11 }} label={{ value: "Time (s)", position: "insideBottom", offset: -14, fontSize: 12 }} />
                <YAxis stroke="var(--color-muted-foreground)" tick={{ fontSize: 11 }} width={72} tickFormatter={(v: number) => v.toExponential(1)} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-card)", fontSize: 12 }}
                  formatter={(v: number, n: string) => [Number(v).toExponential(3), n]}
                  labelFormatter={(l) => `t = ${l} s`}
                />
                <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="euler" name="Basic Euler" stroke="var(--color-chart-3)" dot={false} strokeWidth={2} isAnimationActive={false} />
                <Line type="monotone" dataKey="modified" name="Modified Euler" stroke="var(--color-chart-1)" dot={false} strokeWidth={2} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel title="Step size experiment" subtitle="Effect of h on final position error (same v, ω and total time)">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2 font-medium">Step size h</th>
              <th className="py-2 font-medium">Number of steps</th>
              <th className="py-2 font-medium">Final error — Modified Euler (m)</th>
              <th className="py-2 font-medium">Final error — Basic Euler (m)</th>
            </tr>
          </thead>
          <tbody className="formula">
            {stepTable.map((r) => (
              <tr key={r.h} className="border-b border-border/70">
                <td className="py-2.5">{r.h}</td>
                <td className="py-2.5">{r.steps}</td>
                <td className="py-2.5">{fmtSci(r.finalMe)}</td>
                <td className="py-2.5">{fmtSci(r.finalEu)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Halving the step size reduces the Modified Euler error by roughly a factor of four (second
          order), while the basic Euler error only halves (first order).
        </p>
      </Panel>
    </div>
  );
}
