/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          // Rich dark backgrounds
          surface: {
            50: '#fafafa',
            100: '#f4f4f5',
            200: '#e4e4e7',
            800: '#18181b',
            900: '#09090b',
          },
          // Electric blue accents
          primary: {
            50: '#e6f1fe',
            100: '#cce3fd',
            200: '#99c7fb',
            300: '#66aaf9',
            400: '#338ef7',
            500: '#006FEE',  // Main electric blue
            600: '#005bc4',
            700: '#00449a',
            800: '#002d71',
            900: '#001647',
          },
          // Hot pink accents
          accent: {
            50: '#fde7f3',
            100: '#fbcfe8',
            200: '#f9a8d4',
            300: '#f472b6',
            400: '#FF1CF7',  // Vibrant pink
            500: '#db2777',
            600: '#be185d',
            700: '#9d174d',
            800: '#831843',
            900: '#500724',
          },
          border: {
            light: '#27272a',
            DEFAULT: '#18181b',
            dark: '#09090b',
          }
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Cal Sans', 'Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'scale': 'scale 0.2s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'gradient-xy': 'gradient-xy 15s ease infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scale: {
          '0%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'gradient-xy': {
          '0%, 100%': {
            'background-position': '0% 50%'
          },
          '50%': {
            'background-position': '100% 50%'
          }
        }
      },
      dropShadow: {
        'glow': '0 0 10px rgba(0, 255, 245, 0.3)',
        'glow-lg': '0 0 20px rgba(0, 255, 245, 0.5)'
      }
    },
  },
  plugins: [],
}

