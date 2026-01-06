# Three.js Portfolio

A portfolio website showcasing interactive Three.js visualizations and graphics experiments built with React and Vite.

## Features

- **Home Page**: Project gallery displaying various Three.js experiments
- **Point Cloud Visualization**: Interactive 3D point cloud rendering
- **Animal Render**: 3D animal model rendering
- **Shader Experiments**: Custom WebGL shader demonstrations with switchable effects
- **Debug Mode**: Built-in debug panel for development (access via `/?debug=true`)

## Tech Stack

- **Frontend Framework**: React 19
- **3D Graphics**: Three.js
- **Animation**: GSAP
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Shader Support**: GLSL via vite-plugin-glsl

## Getting Started

### Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

The application will be available at `http://localhost:5173` (default Vite port).

### Build

```bash
# Create production build
npm run build
```

### Preview

```bash
# Preview production build locally
npm run preview
```

### Linting

```bash
# Run ESLint
npm run lint
```

## Debug Mode

To enable debug controls for Three.js scenes:

```
http://localhost:5173/?debug=true
```

This activates the lil-gui debug panel for real-time parameter adjustments.

## Project Structure

```
threejsPortfolio/
├── src/
│   ├── assets/          # Static assets (images, models, etc.)
│   ├── components/      # Reusable React components
│   ├── config/          # Configuration files
│   ├── hooks/           # Custom React hooks
│   ├── layout/          # Layout components
│   ├── pages/           # Page components (routes)
│   ├── ui/              # UI components (Header, Footer)
│   ├── App.jsx          # Main App component
│   └── main.jsx         # Application entry point
├── public/              # Public assets
├── static/              # Static resources
└── world/               # World/scene related files

```

## Available Routes

- `/` - Home page with project gallery
- `/pointCloud` - Point cloud visualization
- `/animalPage` - Animal 3D rendering
- `/shaders` - Shader experiments

## License

Private project

---

Built with ❤️ using Three.js and React
