/**
 * Numerical solvers for the 2D robot kinematic model.
 *
 *   dx/dt     = v * cos(theta)
 *   dy/dt     = v * sin(theta)
 *   dtheta/dt = omega
 *
 * The primary method is the MODIFIED EULER (midpoint) method:
 *
 *   y_(n+1) = y_n + h * f( x_n + h/2 , y_n + (h/2) * f(x_n, y_n) )
 *
 * No predictor-corrector (Heun k1/k2) formulation is used anywhere.
 */

export interface SimParams {
  x0: number;
  y0: number;
  theta0: number;
  v: number;
  omega: number;
  h: number;
  tTotal: number;
}

export interface StateRow {
  step: number;
  t: number;
  x: number;
  y: number;
  theta: number;
}

/** f_x(theta) = v cos(theta) */
const fx = (v: number, theta: number) => v * Math.cos(theta);
/** f_y(theta) = v sin(theta) */
const fy = (v: number, theta: number) => v * Math.sin(theta);
/** f_theta = omega (constant) */
const fTheta = (omega: number) => omega;

/**
 * Modified Euler (midpoint form), applied independently to x, y and theta.
 */
export function solveModifiedEuler(p: SimParams): StateRow[] {
  const { x0, y0, theta0, v, omega, h, tTotal } = p;
  const steps = Math.max(1, Math.round(tTotal / h));

  let x = x0;
  let y = y0;
  let theta = theta0;

  const rows: StateRow[] = [{ step: 0, t: 0, x, y, theta }];

  for (let n = 1; n <= steps; n++) {
    // --- slopes at the current point (x_n, y_n, theta_n) ---
    const slopeX = fx(v, theta);
    const slopeY = fy(v, theta);
    const slopeTheta = fTheta(omega);

    // --- midpoint state:  s_mid = s_n + (h/2) * f(t_n, s_n) ---
    const thetaMid = theta + (h / 2) * slopeTheta;
    // (x_mid / y_mid are computed for completeness; the slopes depend on theta)
    const xMid = x + (h / 2) * slopeX;
    const yMid = y + (h / 2) * slopeY;
    void xMid;
    void yMid;

    // --- slopes evaluated at the midpoint state ---
    const midSlopeX = fx(v, thetaMid);
    const midSlopeY = fy(v, thetaMid);
    const midSlopeTheta = fTheta(omega);

    // --- update with the midpoint slope ---
    x = x + h * midSlopeX;
    y = y + h * midSlopeY;
    theta = theta + h * midSlopeTheta;

    rows.push({ step: n, t: n * h, x, y, theta });
  }

  return rows;
}

/**
 * Basic (forward) Euler — provided only for the accuracy comparison.
 */
export function solveEuler(p: SimParams): StateRow[] {
  const { x0, y0, theta0, v, omega, h, tTotal } = p;
  const steps = Math.max(1, Math.round(tTotal / h));

  let x = x0;
  let y = y0;
  let theta = theta0;

  const rows: StateRow[] = [{ step: 0, t: 0, x, y, theta }];

  for (let n = 1; n <= steps; n++) {
    const nx = x + h * fx(v, theta);
    const ny = y + h * fy(v, theta);
    const nt = theta + h * fTheta(omega);
    x = nx;
    y = ny;
    theta = nt;
    rows.push({ step: n, t: n * h, x, y, theta });
  }

  return rows;
}

/**
 * Analytical (exact) solution for constant v and constant omega.
 * Falls back to straight-line motion when omega -> 0.
 */
export function analyticalState(p: SimParams, t: number): { x: number; y: number; theta: number } {
  const { x0, y0, theta0, v, omega } = p;
  const theta = theta0 + omega * t;

  if (Math.abs(omega) < 1e-12) {
    return { x: x0 + v * Math.cos(theta0) * t, y: y0 + v * Math.sin(theta0) * t, theta };
  }

  return {
    x: x0 + (v / omega) * (Math.sin(theta0 + omega * t) - Math.sin(theta0)),
    y: y0 - (v / omega) * (Math.cos(theta0 + omega * t) - Math.cos(theta0)),
    theta,
  };
}

export function analyticalTrajectory(p: SimParams): StateRow[] {
  const steps = Math.max(1, Math.round(p.tTotal / p.h));
  const rows: StateRow[] = [];
  for (let n = 0; n <= steps; n++) {
    const t = n * p.h;
    const s = analyticalState(p, t);
    rows.push({ step: n, t, ...s });
  }
  return rows;
}

export interface ErrorRow {
  step: number;
  t: number;
  errX: number;
  errY: number;
  errPos: number;
}

export interface ErrorStats {
  rows: ErrorRow[];
  maxError: number;
  finalError: number;
  avgError: number;
}

export function computeErrors(numeric: StateRow[], p: SimParams): ErrorStats {
  const rows: ErrorRow[] = numeric.map((r) => {
    const e = analyticalState(p, r.t);
    const errX = Math.abs(r.x - e.x);
    const errY = Math.abs(r.y - e.y);
    return {
      step: r.step,
      t: r.t,
      errX,
      errY,
      errPos: Math.sqrt((r.x - e.x) ** 2 + (r.y - e.y) ** 2),
    };
  });

  const maxError = rows.reduce((m, r) => Math.max(m, r.errPos), 0);
  const finalError = rows.length ? rows[rows.length - 1]!.errPos : 0;
  const avgError = rows.length ? rows.reduce((s, r) => s + r.errPos, 0) / rows.length : 0;

  return { rows, maxError, finalError, avgError };
}

export interface ValidationResult {
  ok: boolean;
  errors: Partial<Record<keyof SimParams, string>>;
}

export function validateParams(p: SimParams): ValidationResult {
  const errors: Partial<Record<keyof SimParams, string>> = {};
  const finite = (n: number) => Number.isFinite(n);

  (["x0", "y0", "theta0", "v", "omega", "h", "tTotal"] as (keyof SimParams)[]).forEach((k) => {
    if (!finite(p[k])) errors[k] = "Must be a valid number.";
  });

  if (finite(p.h) && p.h <= 0) errors.h = "Step size h must be greater than 0.";
  if (finite(p.tTotal) && p.tTotal <= 0) errors.tTotal = "Total time must be greater than 0.";
  if (finite(p.h) && finite(p.tTotal) && p.h > 0 && p.tTotal > 0) {
    if (p.h > p.tTotal) errors.h = "Step size cannot exceed the total simulation time.";
    else if (p.tTotal / p.h > 20000) errors.h = "Too many steps (max 20000). Increase h.";
  }
  if (finite(p.v) && Math.abs(p.v) > 1000) errors.v = "Velocity magnitude is unrealistically large.";
  if (finite(p.omega) && Math.abs(p.omega) > 100) errors.omega = "Angular velocity is too large.";

  return { ok: Object.keys(errors).length === 0, errors };
}

export const DEFAULT_PARAMS: SimParams = {
  x0: 0,
  y0: 0,
  theta0: 0,
  v: 1,
  omega: 0.2,
  h: 0.1,
  tTotal: 20,
};
