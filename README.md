# Autonomous Software Agents

This project is based on [Deliveroo.js](https://deliveroojs.onrender.com/) which is a minimalistic parcels delivering web-based game developed specifically for this course and for educational purposes. 

<p align="center">
  <img src="deliveroo.png" alt="Alt text" style="display: block; margin: 0 auto;">
</p>


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

## Utility Functions

### go_put_down

We use the following utility function for the $go\_put\_down$ intention:

$$
    utility = scoreInMind - f * dist(me, nearest_delivery) * n_parcels_inmind;
$$

where $scoreInMind$ is the total reward the agent is carrying in his head (he has picked up), $f = \frac{movement\_duration}{parcel\_decaying\_interval}$ which is a ratio that determines how much a parcel's score decays at each step of our agent. Clearly, at each timestep, the total $scoreInMind$ decays by one unit for each parcel he's carrying.

### go_pick_up

The $go\_pick\_up$ utility is more complicated:

$$
    utility = RewardParcel + RewardInMind - decade_frequency * distance_delivery * (numParcelInMind + 1);
$$

where:

$$
    RewardInMind = scoreInMind - decade_frequency * dist(me, parcel) * numParcelInMind;
$$

and 

$$
    RewardParcel = scoreParcel - decade_frequency * dist(me, parcel)
$$

We also introduce a penalty if the distance between me and parcel A is greater than the distance between the nearest agent and parcel A. This penalty is added to the utility function as follows:

$$
    utility = utility - malus * (distance(me, parcel) - dist(nearest_agent, parcel))
$$

where $malus$ is the penalty factor applied to the difference between the distance from me to the parcel and the distance from the nearest agent to the parcel. 
