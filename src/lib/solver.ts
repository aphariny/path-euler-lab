/**
 * Feedback path-tracking simulation of a 2D differential-drive robot.
 *
 * Kinematic model:
 *   dx/dt     = v * cos(theta)
 *   dy/dt     = v * sin(theta)
 *   dtheta/dt = omega
 *
 * Numerical integration: MODIFIED EULER (Heun predictor-corrector)
 *   predictor: s* = s_n + h * f(t_n, s_n)
 *   corrector: s_(n+1) = s_n + (h/2) * [ f(t_n, s_n) + f(t_n + h, s*) ]
 *
 * The control inputs v and omega are recomputed from the tracking error at
 * BOTH the current state and the predicted state (open-loop velocities are
 * never used directly to move the robot).
 */

export interface SimParams {
  x0: number;
  y0: number;
  theta0: number;
  /** desired (reference) linear velocity */
  vd: number;
  /** desired (reference) angular velocity */
  omegad: number;
  h: number;
  tTotal: number;
  /** desired circular path radius */
  R: number;
  /** desired path angular velocity */
  omegap: number;
  kx: number;
  ky: number;
  ktheta: number;
}

export interface StateRow {
  step: number;
  t: number;
  x: number;
  y: number;
  theta: number;
  /** desired path point at this instant */
  xd: number;
  yd: number;
  thetad: number;
  /** control inputs actually applied at this instant */
  v: number;
  omega: number;
  /** heading error (normalized) */
  etheta: number;
  /** position tracking error */
  e: number;
}

interface State {
  x: number;
  y: number;
  theta: number;
}

/** Desired circular path point and heading at time t. */
export function desiredPoint(p: SimParams, t: number) {
  return {
    xd: p.R * Math.cos(p.omegap * t),
    yd: p.R * Math.sin(p.omegap * t),
    thetad: p.omegap * t + Math.PI / 2,
  };
}

/** Normalize an angle to [-pi, pi]. */
export function normalizeAngle(a: number): number {
  let x = a;
  while (x > Math.PI) x -= 2 * Math.PI;
  while (x < -Math.PI) x += 2 * Math.PI;
  return x;
}

/**
 * Kanayama-style feedback controller.
 *   v     = vd cos(etheta) + kx * ex_robot
 *   omega = omegad + vd ( ky * ey_robot + ktheta * sin(etheta) )
 */
export function controller(p: SimParams, s: State, t: number) {
  const { xd, yd, thetad } = desiredPoint(p, t);

  const ex = xd - s.x;
  const ey = yd - s.y;
  const e = Math.sqrt(ex * ex + ey * ey);

  const exRobot = Math.cos(s.theta) * ex + Math.sin(s.theta) * ey;
  const eyRobot = -Math.sin(s.theta) * ex + Math.cos(s.theta) * ey;
  const etheta = normalizeAngle(thetad - s.theta);

  const v = p.vd * Math.cos(etheta) + p.kx * exRobot;
  const omega = p.omegad + p.vd * (p.ky * eyRobot + p.ktheta * Math.sin(etheta));

  return { xd, yd, thetad, ex, ey, e, exRobot, eyRobot, etheta, v, omega };
}

/** Robot kinematics f(state, control). */
function f(s: State, v: number, omega: number) {
  return { dx: v * Math.cos(s.theta), dy: v * Math.sin(s.theta), dtheta: omega };
}

/**
 * MODIFIED EULER (predictor-corrector) path-tracking simulation loop.
 */
export function simulateTracking(p: SimParams): StateRow[] {
  const steps = Math.max(1, Math.round(p.tTotal / p.h));
  const h = p.h;

  let s: State = { x: p.x0, y: p.y0, theta: p.theta0 };
  const rows: StateRow[] = [];

  for (let n = 0; n <= steps; n++) {
    const t = n * h;

    // 1-3. desired point, tracking error, controller outputs at current state
    const c = controller(p, s, t);

    // 7. store the state together with the tracking error
    rows.push({
      step: n,
      t,
      x: s.x,
      y: s.y,
      theta: s.theta,
      xd: c.xd,
      yd: c.yd,
      thetad: c.thetad,
      v: c.v,
      omega: c.omega,
      etheta: c.etheta,
      e: c.e,
    });

    if (n === steps) break;

    // 4. predictor step (explicit Euler)
    const k1 = f(s, c.v, c.omega);
    const pred: State = {
      x: s.x + h * k1.dx,
      y: s.y + h * k1.dy,
      theta: s.theta + h * k1.dtheta,
    };

    // 5. recompute the controller at the predicted state / time
    const cPred = controller(p, pred, t + h);
    const k2 = f(pred, cPred.v, cPred.omega);

    // 6. corrector step (modified Euler average of the two slopes)
    s = {
      x: s.x + (h / 2) * (k1.dx + k2.dx),
      y: s.y + (h / 2) * (k1.dy + k2.dy),
      theta: s.theta + (h / 2) * (k1.dtheta + k2.dtheta),
    };
  }

  return rows;
}

export interface ErrorStats {
  finalError: number;
  maxError: number;
  meanError: number;
  rmse: number;
}

export function computeErrorStats(rows: StateRow[]): ErrorStats {
  if (rows.length === 0) return { finalError: 0, maxError: 0, meanError: 0, rmse: 0 };
  let max = 0;
  let sum = 0;
  let sumSq = 0;
  for (const r of rows) {
    max = Math.max(max, r.e);
    sum += r.e;
    sumSq += r.e * r.e;
  }
  return {
    finalError: rows[rows.length - 1]!.e,
    maxError: max,
    meanError: sum / rows.length,
    rmse: Math.sqrt(sumSq / rows.length),
  };
}

/** Desired path sampled densely for plotting. */
export function desiredPath(p: SimParams, samples = 400) {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * p.tTotal;
    const d = desiredPoint(p, t);
    pts.push({ x: d.xd, y: d.yd });
  }
  return pts;
}

export interface ValidationResult {
  ok: boolean;
  errors: Partial<Record<keyof SimParams, string>>;
}

export function validateParams(p: SimParams): ValidationResult {
  const errors: Partial<Record<keyof SimParams, string>> = {};
  const keys: (keyof SimParams)[] = [
    "x0",
    "y0",
    "theta0",
    "vd",
    "omegad",
    "h",
    "tTotal",
    "R",
    "omegap",
    "kx",
    "ky",
    "ktheta",
  ];
  keys.forEach((k) => {
    if (!Number.isFinite(p[k])) errors[k] = "Must be a valid number.";
  });

  if (Number.isFinite(p.h) && p.h <= 0) errors.h = "Step size h must be greater than 0.";
  if (Number.isFinite(p.tTotal) && p.tTotal <= 0) errors.tTotal = "Total time must be greater than 0.";
  if (Number.isFinite(p.h) && Number.isFinite(p.tTotal) && p.h > 0 && p.tTotal > 0) {
    if (p.h > p.tTotal) errors.h = "Step size cannot exceed the total simulation time.";
    else if (p.tTotal / p.h > 20000) errors.h = "Too many steps (max 20000). Increase h.";
  }
  if (Number.isFinite(p.R) && p.R <= 0) errors.R = "Radius must be greater than 0.";
  if (Number.isFinite(p.vd) && Math.abs(p.vd) > 1000) errors.vd = "Velocity magnitude is unrealistically large.";
  if (Number.isFinite(p.omegad) && Math.abs(p.omegad) > 100) errors.omegad = "Angular velocity is too large.";

  return { ok: Object.keys(errors).length === 0, errors };
}

export const DEFAULT_PARAMS: SimParams = {
  x0: 0.5,
  y0: -1.5,
  theta0: 0,
  vd: 1,
  omegad: 0.2,
  h: 0.05,
  tTotal: 40,
  R: 5,
  omegap: 0.2,
  kx: 1,
  ky: 1,
  ktheta: 2,
};
