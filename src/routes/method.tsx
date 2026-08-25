import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { FormulaCard, Panel, SectionHeading, WhatIsHappening } from "@/components/ui-blocks";

export const Route = createFileRoute("/method")({
  head: () => ({
    meta: [
      { title: "Numerical Method — Modified Euler Midpoint Form" },
      {
        name: "description",
        content:
          "Step-by-step explanation of the Modified Euler midpoint method and how it is applied to the robot kinematic equations.",
      },
      { property: "og:title", content: "Numerical Method — Modified Euler Midpoint Form" },
      {
        property: "og:description",
        content: "Derivation, algorithm and worked structure of the Modified Euler midpoint method.",
      },
    ],
  }),
  component: MethodPage,
});

const FLOW = [
  "Initial Value",
  "Current Slope",
  "Midpoint Prediction",
  "Midpoint Slope",
  "Next Value",
  "Repeat",
];

const STEPS = [
  ["Start with the current value.", "The known state at time tₙ: xₙ, yₙ, θₙ."],
  ["Calculate the slope at the current point.", "Evaluate f(xₙ, yₙ) from the differential equations."],
  ["Estimate the midpoint.", "Advance half a step using that slope."],
  ["Calculate the slope at the midpoint.", "Re-evaluate f at the half-step state."],
  ["Use the midpoint slope for the next value.", "A full step h is taken with the better slope."],
  ["Repeat for every time step.", "Iterate until the total simulation time is reached."],
];

function MethodPage() {
  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Theory"
        title="The Modified Euler (midpoint) method"
        description="A second-order single-step method that replaces the beginning-of-interval slope with the slope evaluated at the middle of the interval."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="General formulation">
          <FormulaCard lines={["dy/dx = f(x, y)"]} caption="A first-order ordinary differential equation." />
          <div className="mt-4">
            <FormulaCard
              lines={["x₍ₙ₊₁ᐟ₂₎ = xₙ + h/2", "y₍ₙ₊₁ᐟ₂₎ = yₙ + (h/2)·f(xₙ, yₙ)"]}
              caption="Half-step prediction of the midpoint state."
            />
          </div>
          <div className="mt-4">
            <FormulaCard
              lines={["yₙ₊₁ = yₙ + h·f(x₍ₙ₊₁ᐟ₂₎, y₍ₙ₊₁ᐟ₂₎)"]}
              caption="The full step is taken with the midpoint slope."
            />
          </div>
          <div className="mt-4">
            <FormulaCard
              lines={["yₙ₊₁ = yₙ + h·f( xₙ + h/2 , yₙ + (h/2)·f(xₙ, yₙ) )"]}
              caption="Compact single-line form used in this project."
            />
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title="Algorithm">
            <ol className="space-y-3">
              {STEPS.map(([t, d], i) => (
                <li key={t} className="flex gap-3">
                  <span className="formula mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t}</p>
                    <p className="text-xs text-muted-foreground">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel title="Method flow">
            <div className="flex flex-wrap items-center gap-2">
              {FLOW.map((f, i) => (
                <span key={f} className="flex items-center gap-2">
                  <span className="rounded-lg border border-border bg-secondary/70 px-3 py-1.5 text-xs font-medium text-foreground">
                    {f}
                  </span>
                  {i < FLOW.length - 1 ? <ArrowRight className="size-3.5 text-primary" /> : null}
                </span>
              ))}
            </div>
          </Panel>

          <WhatIsHappening>
            It improves the approximation by using the slope at the midpoint rather than relying only
            on the slope at the beginning of the interval. The local truncation error therefore falls
            from O(h²) for simple Euler to O(h³) per step.
          </WhatIsHappening>
        </div>
      </div>

      <Panel title="Application to the robot model" subtitle="The midpoint rule applied independently to x, y and θ">
        <div className="grid gap-4 md:grid-cols-3">
          <FormulaCard
            lines={[
              "slope_x = v·cos(θₙ)",
              "θ_mid = θₙ + (h/2)·ω",
              "mid_slope_x = v·cos(θ_mid)",
              "xₙ₊₁ = xₙ + h·mid_slope_x",
            ]}
            caption="X update"
          />
          <FormulaCard
            lines={[
              "slope_y = v·sin(θₙ)",
              "θ_mid = θₙ + (h/2)·ω",
              "mid_slope_y = v·sin(θ_mid)",
              "yₙ₊₁ = yₙ + h·mid_slope_y",
            ]}
            caption="Y update"
          />
          <FormulaCard
            lines={["slope_θ = ω", "θ_mid = θₙ + (h/2)·ω", "θₙ₊₁ = θₙ + h·ω"]}
            caption="θ update (slope is constant, so the midpoint slope equals ω)"
          />
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Because the velocity components depend on the heading, the midpoint heading θ_mid is the
          quantity that carries the extra accuracy: evaluating cos and sin at θ_mid instead of θₙ
          captures the turning that occurs during the interval.
        </p>
      </Panel>
    </div>
  );
}
