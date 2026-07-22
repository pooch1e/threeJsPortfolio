# Monorepo with independent deploys

The frontend (Three.js/React) and backend (Go API) live in one repo and share no code or types, but are deployed as two separate apps. We chose a single repo over splitting them because this is one personal portfolio project — one repo keeps docs, issues, and history in one place, which outweighs the coordination benefit of a hard repo boundary. Each context still gets its own `CONTEXT.md` since their vocabularies don't overlap.
