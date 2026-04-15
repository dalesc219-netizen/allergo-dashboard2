module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'apple-black': '#000000',
        'apple-base': '#161618',
        'apple-elevated': '#212124',
        'apple-gray': '#818181',
      },
      backgroundImage: {
        'liquid-glow': 'linear-gradient(to bottom, rgba(255,255,255,0.1), transparent)',
      },
      boxShadow: {
        'liquid': '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.12)',
      }
    },
  },
  plugins: [], 
};