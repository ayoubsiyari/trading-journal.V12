module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class', // enable .dark class toggling
  theme: {
    extend: {
      boxShadow: {
        'card': '0 2px 8px rgba(0,0,0,0.04)',
        'card-hover': '0 6px 20px rgba(0,0,0,0.12)',
      },
      backdropBlur: {
        xs: '2px',
      },
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
        },
      },
    },
  },
  plugins: [],
}
