/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'neon-cyan': '#00FFFF',
        'neon-violet': '#8B5CF6',
        'dark-bg': '#0A0A0A',
        'glass-white': 'rgba(255, 255, 255, 0.05)',
        'glass-border': 'rgba(255, 255, 255, 0.1)',
      },
      boxShadow: {
        'neon-glow': '0 0 15px rgba(0, 255, 255, 0.4)',
        'violet-glow': '0 0 15px rgba(139, 92, 246, 0.4)',
        'spatial': '0 20px 40px -10px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
        'glass-drop': '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
      },
      backgroundImage: {
        'spatial-gradient': 'radial-gradient(circle at 50% -20%, rgba(139, 92, 246, 0.15) 0%, rgba(10, 10, 10, 1) 60%)',
      }
    },
  },
  plugins: [],
};
export default config;
