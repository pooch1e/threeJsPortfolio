# Three.js Portfolio - AI Assistant Context

## Project Overview

This is a React-based portfolio showcasing interactive Three.js visualizations and WebGL shader experiments. Built with Vite, React 19, and modern web technologies.

## Tech Stack

- **Frontend**: React 19 with React Router DOM
- **3D Graphics**: Three.js 0.180.0
- **Animations**: GSAP
- **Build Tool**: Vite 7.x
- **Styling**: Tailwind CSS with @tailwindplus/elements
- **Shaders**: GLSL (via vite-plugin-glsl)
- **Development**: ESLint, lil-gui for debugging

## Project Structure

- `/src/pages/` - Route pages (HomePage, PointCloudPage, AnimalRenderPage, ShaderPage)
- `/src/components/` - Reusable React components
- `/src/hooks/` - Custom React hooks (e.g., useWorld)
- `/src/ui/` - UI components (Header, Footer)
- `/world/` - Three.js scene/world logic and shader files
- `/world/shaderTestWorld/shaders/` - GLSL shader experiments (atmosphere, galaxy, holographic, etc.)

## Development Practices

- Use React 19 features and modern JavaScript
- Debug mode available via `/?debug=true` query parameter (enables lil-gui)
- Run `npm run dev` to start development server (port 5173)
- Run `npm run lint` before commits to catch issues
- Shader files are `.glsl` and imported via vite-plugin-glsl

## Coding Conventions

- Component files use `.jsx` extension
- Functional components with hooks (no class components)
- Three.js scenes are managed through custom hooks (see `useWorld.jsx`)
- Each shader experiment has its own folder with `vertex.glsl` and `fragment.glsl`

## When Making Changes

- **Adding new shader**: Create folder in `/world/shaderTestWorld/shaders/` with vertex.glsl and fragment.glsl
- **New visualization page**: Add to `/src/pages/`, register route in App.jsx
- **Styling**: Use Tailwind utility classes
- **Three.js scenes**: Follow patterns in existing page components
- Test in debug mode when modifying 3D scenes

## Build & Deploy

- Production build: `npm run build` (outputs to `/dist`)
- Preview build: `npm run preview`
- Ensure all shaders compile before deploying
