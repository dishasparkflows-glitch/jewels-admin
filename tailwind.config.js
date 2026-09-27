/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#faf6f0',
          100: '#f4ece0',
          200: '#e8d9c2',
          300: '#d8c09e',
          400: '#b8946c',
          500: '#8b6f4e', // Exact luxury bronze from screenshot
          600: '#7a5f3f',
          700: '#644d32',
          800: '#523e2a',
          900: '#433324',
        },
        luxury: {
          bg: '#fbfaf8',
          card: '#ffffff',
          border: '#eee8df',
          text: '#1a1a1a',
          muted: '#8a8a8a',
          bar: '#e8dfd5',
          barActive: '#8b6f4e',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
