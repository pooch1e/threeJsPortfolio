# Frontend — Creative Portfolio

A React application showcasing generative/3D graphics work, titled "Experiments." Each Experiment is a self-contained visual piece built with Three.js (or occasionally p5.js).

## Language

**Experiment**:
A named, self-contained creative piece surfaced on the portfolio (e.g. Flower, Forest, Shader). The domain-level unit of content — what a visitor thinks of as "one piece of work."
_Avoid_: World (when referring to the whole piece), scene, sketch (Three.js context)

**Experience**:
The orchestrator class for an Experiment's Three.js setup — owns the camera, renderer, and scene lifecycle.

**World**:
The content-manager class within an Experiment — loads and manages that Experiment's specific meshes, materials, and behavior. Distinct from "Experiment": World is the implementation class, Experiment is the named creative piece it implements.

**Object**:
A Three.js mesh, material, or shader-driven component owned by a World.
