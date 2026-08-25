# Robot Navigator

Build a polished, modern, interactive educational web application titled:

"Robot Path Tracking and Navigation Using the Modified Euler Method"

This is a university Numerical Methods capstone project. The application must focus primarily on demonstrating the Modified Euler numerical method through a 2D robot path-tracking simulation.

IMPORTANT:

Use the MIDPOINT FORM of the Modified Euler Method, NOT the k1/k2 predictor-corrector formulation.

The core general formula is:

y_(n+1) = y_n + h f(x_n + h/2, y_n + (h/2)f(x_n,y_n))

For the robot simulation, use the following differential equations:

dx/dt = v cos(theta)

dy/dt = v sin(theta)

dtheta/dt = omega

Apply the Modified Euler midpoint method independently to x, y, and theta.

The application should be fully functional. Do not create a static mockup. All calculations, tables, graphs, controls, and comparisons should work in the browser.

==================================================

1. OVERALL DESIGN

==================================================

Create a professional academic/scientific dashboard.

Visual style:

- Modern engineering/research aesthetic

- Clean white/light background with dark navy text

- Blue/cyan accent colors

- Rounded cards

- Subtle shadows

- Excellent spacing

- Professional typography

- Responsive design

- Avoid excessive gradients

- Avoid cartoonish robotics graphics

- Make it look like a serious university engineering project

The application should feel like a Numerical Methods simulation laboratory.

Use a sidebar or top navigation with these sections:

1. Overview

2. Simulation

3. Numerical Method

4. Results & Error Analysis

==================================================

2. OVERVIEW PAGE

==================================================

Create a strong landing/dashboard section.

Title:

"Robot Path Tracking Using the Modified Euler Method"

Subtitle:

"Numerical simulation of two-dimensional robot motion using the Modified Euler midpoint method."

Show four metric/info cards:

- Numerical Method

  Modified Euler Method

- Mathematical Model

  2D Robot Motion

- State Variables

  x, y, theta

- Simulation Type

  Numerical Approximation

Include a short explanation:

"Robot motion can be modeled using ordinary differential equations. When an analytical solution is inconvenient, numerical methods provide approximate solutions at discrete time intervals. This project applies the Modified Euler midpoint method to estimate the robot's position and orientation over time."

Also show the three governing equations:

dx/dt = v cos(theta)

dy/dt = v sin(theta)

dtheta/dt = omega

==================================================

3. SIMULATION PAGE

==================================================

This is the MAIN interactive section.

Create a parameter input panel on the left and a large trajectory visualization on the right.

Input controls:

Initial X position:

default = 0

Initial Y position:

default = 0

Initial angle theta:

default = 0

Linear velocity v:

default = 1

Angular velocity omega:

default = 0.2

Step size h:

default = 0.1

Total simulation time:

default = 20

Provide a clear button:

"Run Simulation"

Also provide:

"Reset"

Validate all inputs and display useful error messages for invalid values.

==================================================

4. MODIFIED EULER IMPLEMENTATION

==================================================

Implement the numerical method in JavaScript/TypeScript in the browser.

Do NOT fake the numerical results.

For each time step:

For x:

dx/dt = v cos(theta)

Calculate the current slope.

Calculate the midpoint state:

x_mid = x_n + (h/2) * dx/dt

theta_mid = theta_n + (h/2) * dtheta/dt

Then calculate the midpoint slope for x.

Update:

x_(n+1) = x_n + h * midpoint_slope_x

For y:

dy/dt = v sin(theta)

Calculate the midpoint state and midpoint slope.

Update:

y_(n+1) = y_n + h * midpoint_slope_y

For theta:

dtheta/dt = omega

Calculate:

theta_mid = theta_n + (h/2) * omega

Then:

theta_(n+1) = theta_n + h * omega

The implementation must follow the Modified Euler midpoint method consistently.

IMPORTANT:

Do not use a simple Euler update as the main method.

Do not use the k1/k2 Heun predictor-corrector method.

==================================================

5. ROBOT TRAJECTORY VISUALIZATION

==================================================

Create a large interactive 2D graph.

Plot:

- Robot trajectory

- Starting point

- Final point

- Optional target point

- Robot direction indicator/arrow at the current or final position

The graph should have:

- X axis labeled "X Position (m)"

- Y axis labeled "Y Position (m)"

- Grid

- Legend

- Zoom/pan if practical

Use a smooth engineering-style visualization.

When the user changes parameters and presses "Run Simulation", update the graph immediately.

Show summary cards below the graph:

Final X Position

Final Y Position

Final Theta

Total Simulation Time

Number of Time Steps

==================================================

6. NUMERICAL RESULTS TABLE

==================================================

Below the graph, create a numerical results table.

Columns:

Step

Time

X

Y

Theta

Show the calculated values generated by the actual Modified Euler computation.

Allow the user to view all calculated rows.

Format numerical values to a reasonable number of decimal places.

Highlight the initial and final rows.

==================================================

7. NUMERICAL METHOD PAGE

==================================================

Create a visually attractive explanation of the Modified Euler midpoint method.

Show:

General differential equation:

dy/dx = f(x,y)

Then show:

x_(n+1/2) = x_n + h/2

y_(n+1/2) = y_n + (h/2) f(x_n,y_n)

Then:

y_(n+1) = y_n + h f(x_(n+1/2), y_(n+1/2))

Explain the algorithm in simple steps:

1. Start with the current value.

2. Calculate the slope at the current point.

3. Estimate the midpoint.

4. Calculate the slope at the midpoint.

5. Use the midpoint slope to calculate the next value.

6. Repeat for every time step.

Include a simple visual flow:

Initial Value

→ Current Slope

→ Midpoint Prediction

→ Midpoint Slope

→ Next Value

→ Repeat

Also explain why Modified Euler is useful:

"It improves the approximation by using the slope at the midpoint rather than relying only on the slope at the beginning of the interval."

==================================================

8. ERROR ANALYSIS PAGE

==================================================

This section is VERY IMPORTANT because this is a Numerical Methods project.

Create an "Error Analysis" section.

Provide a theoretical/reference trajectory for the constant velocity and constant angular velocity case.

For v and omega constant, use the analytical solution:

x(t) = x0 + (v/omega)[sin(theta0 + omega*t) - sin(theta0)]

y(t) = y0 - (v/omega)[cos(theta0 + omega*t) - cos(theta0)]

theta(t) = theta0 + omega*t

Compare the Modified Euler numerical solution with the analytical/reference solution.

Calculate:

Absolute X Error

Absolute Y Error

Position Error

Position error can be calculated as:

sqrt((x_numerical - x_exact)^2 + (y_numerical - y_exact)^2)

Display:

- Maximum error

- Final error

- Average error

Create an error-vs-time graph.

==================================================

9. EULER VS MODIFIED EULER COMPARISON

==================================================

Add a comparison section.

Run the SAME robot problem using:

1. Basic Euler Method

2. Modified Euler Midpoint Method

Compare their final and maximum position errors.

Display a professional comparison table:

Method | Final Error | Maximum Error

Euler

Modified Euler

Also create a graph showing error versus time for both methods.

Clearly highlight that Modified Euler should generally provide a more accurate approximation for this problem.

This comparison must use actual calculated values, not hardcoded fake values.

==================================================

10. STEP SIZE EXPERIMENT

==================================================

Add an optional small experiment section.

Allow users to compare results for:

h = 0.5

h = 0.2

h = 0.1

h = 0.05

Show how changing the step size affects numerical accuracy.

Display a table:

Step Size | Number of Steps | Final Error

This demonstrates an important Numerical Methods concept: the relationship between step size and numerical accuracy.

==================================================

11. EDUCATIONAL EXPLANATION

==================================================

Throughout the application, explain the mathematics clearly enough that a university student can present it during a viva.

Use short explanations rather than huge paragraphs.

Include a small "What is happening?" panel beside important calculations.

For example:

"At each step, the method estimates the slope at the midpoint of the interval and uses that midpoint slope to obtain a more accurate next position."

==================================================

12. UI DETAILS

==================================================

Use reusable components.

Create:

- Navigation

- Cards

- Input fields

- Buttons

- Tabs

- Charts

- Tables

- Mathematical formula cards

- Tooltips where useful

Use icons sparingly and professionally.

Add subtle animations when switching sections or running a simulation.

Show a loading/calculation state briefly when running a simulation if appropriate.

==================================================

13. TECHNOLOGY

==================================================

Use:

- React

- TypeScript

- Tailwind CSS

- A suitable charting library such as Recharts

Keep the numerical computation separate from the UI components.

Create a clean numerical solver function/module so that the Modified Euler implementation is easy to inspect and explain.

No backend is required.

No database is required.

Everything can run client-side.

==================================================

14. IMPORTANT PROJECT BOUNDARIES

==================================================

This is a NUMERICAL METHODS project.

Do NOT add:

- Machine learning

- AI

- Computer vision

- Real robot hardware

- Sensors

- IoT

- Path planning algorithms such as A*

- Reinforcement learning

- Unnecessary authentication

- Database functionality

The focus must remain:

Differential Equations

+

Modified Euler Method

+

Numerical Approximation

+

Robot Path Tracking

+

Error Analysis

+

Visualization

==================================================

15. FINAL USER EXPERIENCE

==================================================

The user should be able to:

1. Open the webpage.

2. Understand the project from the Overview.

3. Enter robot and numerical parameters.

4. Click Run Simulation.

5. See the robot trajectory.

6. See the numerical values.

7. Understand how Modified Euler produced those values.

8. View numerical error.

9. Compare Euler and Modified Euler.

10. Experiment with step sizes.

The final webpage should look polished enough to demonstrate as a university capstone project.

Prioritize FUNCTIONALITY and MATHEMATICAL CORRECTNESS over decorative UI.

Do not hardcode simulation results.

Make every calculation come from the entered parameters.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/22131190-2fb5-406a-b3bb-662a5dcca9c2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
