/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        karrik: ['Karrik', 'sans-serif'],
      },

      
      fontSize: {
        100: [
          'var(--font-size-100)',
          { lineHeight: 'var(--line-height-normal)' },
        ],
        200: [
          'var(--font-size-200)',
          { lineHeight: 'var(--line-height-normal)' },
        ],
        300: [
          'var(--font-size-300)',
          { lineHeight: 'var(--line-height-tight)' },
        ],
        400: [
          'var(--font-size-400)',
          { lineHeight: 'var(--line-height-tight)' },
        ],
      },
      fontWeight: {
        regular: 'var(--font-weight-regular)',
        medium: 'var(--font-weight-medium)',
        semibold: 'var(--font-weight-semibold)',
        bold: 'var(--font-weight-bold)',
      },
      lineHeight: {
        tight: 'var(--line-height-tight)',
        normal: 'var(--line-height-normal)',
        relaxed: 'var(--line-height-relaxed)',
      },

      // Colors
      colors: {
        mainbackground: 'var(--color-bg)',
        lightbackground: 'var(--color-bg-mid)',
        maintext: 'var(--text-color-verydark)',
        hovertext: 'var(--text-color-standard)',
      },

      // Spacing (margin/padding)
      spacing: {
        1: 'var(--space-1)',
        2: 'var(--space-2)',
        3: 'var(--space-3)',
        4: 'var(--space-4)',
        6: 'var(--space-6)',
        8: 'var(--space-8)',
        10: 'var(--space-10)',
        12: 'var(--space-12)',
      },

      // Width / Height
      width: {
        card: 'var(--size-card-w)',
        content: 'var(--size-content-w)',
      },
      height: {
        card: 'var(--size-card-h)',
        hero: 'var(--size-hero-h)',
      },

      // Shadows
      boxShadow: {
        soft: 'var(--shadow-soft)',
        card: 'var(--shadow-card)',
        focus: 'var(--shadow-focus)',
      },
    },
  },
  plugins: [],
};
