/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))', input: 'hsl(var(--input))', ring: 'hsl(var(--ring))', background: 'hsl(var(--background))', foreground: 'hsl(var(--foreground))', primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' }, secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' }, destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' }, accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' }, popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
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
