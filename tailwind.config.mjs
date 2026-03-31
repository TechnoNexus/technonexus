/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'neon-cyan': '#00FFFF',
        'neon-violet': '#8B5CF6',
        'dark-bg': '#0A0A0A',
      },
      boxShadow: {
        'neon-glow': '0 0 15px rgba(0, 255, 255, 0.4)',
        'violet-glow': '0 0 15px rgba(139, 92, 246, 0.4)',
      }
    },
  },
  plugins: [],
};
export default config;
