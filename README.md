![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![PyTorch](https://img.shields.io/badge/PyTorch-%23EE4C2C.svg?style=for-the-badge&logo=PyTorch&logoColor=white)
<p align='center'>
    <h1 align="center">NLU tasks</h1>
    <p align="center">
    Project for NLU at the University of Trento A.Y.2023/2024
    </p>
    <p align='center'>
    Developed by:<br>
    De Martini Davide <br>
    </p>   
</p>

# ASAP

## Table of Contents

- [ASAP](#asap)
  - [Table of Contents](#table-of-contents)
  - [Project Overview](#project-overview)
  - [Project Structure](#project-structure)
  - [Installation](#installation)
  - [Running the Project](#running-the-project)
- [Contacts](#contacts)

## Project Overview
This project is part of the "Autonomous Software Agents" master course. The objective is to develop an autonomous agent based on the Belief-Desire-Intention (BDI) architecture. The agent is designed to play a game where it must pick up and deliver parcels. Interaction with the game environment is facilitated through the API provided by the [Deliveroo.js](https://github.com/unitn-ASA/DeliverooAgent.js) project.

<p align="center">
  <img src="img_README/deliveroo.png" alt="Deliveroo Agent" style="display: block; margin: 0 auto; width: 500px;">
</p>

## Project Structure

```plaintext
ASAP/
├── belief/
│   ├── agentData.js           # Manages information related to the agent(s)
│   ├── belief.js              # Handles general belief management
│   ├── map.js                 # Stores map-related data
│   ├── utilsBelief.js         # Utility functions for belief management
|
├── coordination/
│   ├── coordination.js        # Manages inter-agent communication 
|
├── intention&revision/
│   ├── agent.js               # Manages agent loop and intentions
│   ├── intention.js           # Handles intention execution
│   ├── options.js             # Manages options loop to select the best action
│   ├── utilsOptions.js        # Utility functions for selecting options and calculating utilities
|
├── planner/
│   ├── domain.pddl/           # PDDL domain definition
│   ├── plans.js               # Contains all possible plans
│   ├── utils_planner.js       # Utility functions for planning (e.g., BFS)
|
├── config.js                  # Configuration parameters
├── index.js                   # Entry point for running the agent
└── socketConnection.js        # Manages the client socket connection
Report_ASA.pdf                 # report of the project
```

## Installation

1. **Clone the repository:**
   ```
   git clone https://github.com/Roman-Simone/ASA_Project.git
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Set up Docker environment for PDDL:**
   
   If you want to solve PDDL problems locally, follow the instructions in the [Planutils Server Environment](https://github.com/AI-Planning/planutils/tree/main/environments/server) to set up the Docker environment required for the PDDL planners (otherwise don't do anything).

   Then, update the parameters in node_modules/@unitn-asa/pddl-client/src/PddlOnlineSolver.js to:
    
    ```bash
    const HOST = "http://localhost:5001"
    const PATH = "/package/dual-bfws-ffparser/solve"
    ```

## Running the Project

The program supports two modes:

1. Single Agent Mode: Run a single agent in the game.

    ```bash
    node index.js ONE agent_1
    ```
2. Multi-Agent Mode: Run two agents (one MASTER and one SLAVE) in the game.

    ```bash
    node index.js TWO agent_1
    node index.js TWO agent_2
    ```

# Contacts
For any inquiries, feel free to contact:

- Simone Roman - [simone.roman@studenti.unitn.it](mailto:simone.roman@studenti.unitn.it)

- Stefano Bonetto - [stefano.bonetto@studenti.unitn.it](mailto:stefano.bonetto@studenti.unitn.it)

<br>

<div>
    <a href="https://www.unitn.it/">
        <img src="https://ing-gest.disi.unitn.it/wp-content/uploads/2022/11/marchio_disi_bianco_vert_eng-1024x295.png" width="400px">
    </a>
</div>
