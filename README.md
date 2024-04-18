# Autonomous Software Agents

![deliveroo](image_url)

The objective of the project is to develop an autonomous software that will play on your behalf, the main goal of the game is earning points by collecting as many parcels as possible and delivering them in the delivery zone.

We want to use a BDI architecture:
<ul>
  <li>Sensing the environment and managing Beliefs</li>
  <li>Deliberating Intentions</li>
  <li>Select plans from a library</li>
  <li>Using an external planner component</li>
  <li>Execute a plan (actions)</li>
  <li>Defining strategies and behaviours</li>
  <li>Replanning and redeliberating</li>
</ul>

The project is divided into two main parts.

## First Part
<ul>
    <li>Develop an autonomous agent to act on behalf of the user.</li>
    <li>Implement functionality to represent and manage beliefs from sensing data, including belief revision.</li>
    <li>Enable activation of goals/intentions and actions on the environment, including intention revision.</li>
    <li>Utilize predefined plans to achieve goals/intentions (parcels are known from the beginning).</li>
    <li>Extend the software with automated planning.</li>
    <li>Once an intention is activated, call the planner to generate the plan to execute.</li>
    <li>Validate and test the system with predefined simulation runs.</li>
</ul>

## Second Part
<h2>Second Part</h2>
<ul>
    <li>Extend the software to include a second autonomous software agent.</li>
    <li>Enable communication between the two agents.</li>
    <li>Allow the exchange of beliefs (e.g., beliefs about the environment that the other cannot see, beliefs about
        committed intentions, etc.).</li>
    <li>Implement coordination between agents (e.g., the closest agent will commit to pick up a new parcel).</li>
    <li>Enable negotiation between agents (e.g., one agent offers to deliver a parcel in exchange for the other
        agent picking up a new parcel).</li>
    <li>Validate and test the system with predefined simulation runs.</li>
</ul>
