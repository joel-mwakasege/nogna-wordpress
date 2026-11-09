/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        nogna: {
          canvas: '#181818',
          sidebar: '#1c1c1c',
          panel: '#222222',
          elevated: '#2b2b2b',
          border: '#363636',
          text: '#f1f1f1',
          muted: '#999999',
          accent: '#559cf0',
          success: '#35b97b'
        }
      }
    }
  },
  plugins: []
};
