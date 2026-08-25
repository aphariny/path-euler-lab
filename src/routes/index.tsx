import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FunctionSquare, Move3d, Sigma, Waves } from "lucide-react";
import { FormulaCard, MetricCard, Panel, SectionHeading, WhatIsHappening } from "@/components/ui-blocks";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Robot Path Tracking Using the Modified Euler Method" },
      {
        name: "description",
        content:
          "Interactive numerical methods laboratory simulating 2D robot motion with the Modified Euler midpoint method, error analysis and step-size experiments.",
      },
      { property: "og:title", content: "Robot Path Tracking Using the Modified Euler Method" },
      {
        property: "og:description",
        content:
          "Simulate two-dimensional robot motion with the Modified Euler midpoint method and analyse numerical error.",
      },
    ],
  }),
  component: Overview,
});

function Overview() {
  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Numerical Methods Capstone"
        title="Robot Path Tracking Using the Modified Euler Method"
        description="Numerical simulation of two-dimensional robot motion using the Modified Euler midpoint method."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Numerical Method" value="Modified Euler Method" hint="Midpoint form" icon={<Sigma className="size-4" />} />
        <MetricCard label="Mathematical Model" value="2D Robot Motion" hint="Unicycle kinematics" icon={<Move3d className="size-4" />} />
        <MetricCard label="State Variables" value="x, y, θ" hint="Position and orientation" icon={<FunctionSquare className="size-4" />} />
        <MetricCard label="Simulation Type" value="Numerical Approximation" hint="Discrete time stepping" icon={<Waves className="size-4" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Project abstract">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Robot motion can be modeled using ordinary differential equations. When an analytical
            solution is inconvenient, numerical methods provide approximate solutions at discrete
            time intervals. This project applies the Modified Euler midpoint method to estimate the
            robot's position and orientation over time.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              ["Model", "Differential equations describe the robot velocity in the plane."],
              ["Method", "The midpoint slope advances the state one step at a time."],
              ["Analysis", "Numerical output is compared with the exact circular solution."],
            ].map(([t, d]) => (
              <div key={t} className="rounded-xl border border-border bg-secondary/50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">{t}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/simulation">
                Open simulation <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/method">Study the method</Link>
            </Button>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title="Governing equations" subtitle="Planar kinematic model of the robot">
            <FormulaCard
              lines={["dx/dt = v · cos(θ)", "dy/dt = v · sin(θ)", "dθ/dt = ω"]}
              caption="v is the linear velocity (m/s), ω the angular velocity (rad/s)."
            />
          </Panel>
          <WhatIsHappening>
            The three equations are integrated together: θ controls the direction of travel, while v
            fixes how far the robot moves along that direction during each time step.
          </WhatIsHappening>
        </div>
      </div>
    </div>
  );
}
