/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0e3860',
          navyHover: '#0a2a48',
          blue: '#1e40af',
          lightBg: '#f8fafc',
          panelBorder: '#e2e8f0',
        }
      },
      boxShadow: {
        'window': '0 20px 40px -15px rgba(0, 0, 0, 0.25)',
      }
    },
  },
  plugins: [],
}
