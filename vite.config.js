import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import glsl from 'vite-plugin-glsl';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    glsl({
      include: '**/*.glsl',
      exclude: 'node_modules/**',
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core vendor — loaded once, cached long-term
          'vendor-three': ['three'],
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-gsap': ['gsap'],
          'vendor-csm': ['three-custom-shader-material'],

          // Each world experience as its own async chunk
          'world-animal': [
            './world/animalWorld/ModelExperience.js',
            './world/animalWorld/Environment.js',
            './world/animalWorld/Floor.js',
            './world/animalWorld/Fox.js',
            './world/animalWorld/Rat.js',
            './world/animalWorld/World.js',
          ],
          'world-portal': [
            './world/portalWorld/Portal.js',
            './world/portalWorld/PortalExperience.js',
          ],
          'world-pointcloud': [
            './world/pointCloudWorld/Point.js',
            './world/pointCloudWorld/World.js',
            './world/pointCloudWorld/PointExperience.js',
          ],
          'world-sine': [
            './world/sineWorld/SineWave.js',
            './world/sineWorld/SineExperience.js',
          ],
          'world-ascii': [
            './world/asciiWorld/Ascii.js',
            './world/asciiWorld/AsciiExperience.js',
          ],
          // Shader world modules are already dynamically imported via shaderConfig.js
          // so they will naturally split — only the experience shell goes here
          'world-shader': [
            './world/shaderTestWorld/ShaderExperience.js',
          ],
        },
      },
    },
    // Raise the warning limit slightly — Three.js vendor chunk is intentionally large
    chunkSizeWarningLimit: 800,
  },
});
