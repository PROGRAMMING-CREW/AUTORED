/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Acento: naranja "brasa". 600 con texto blanco = contraste 5.2:1
        brand: {
          50: '#FFF4EC', 100: '#FFE6D2', 200: '#FFCBA4', 300: '#FFA66B', 400: '#F97A30',
          500: '#E85D12', 600: '#C2410C', 700: '#9A3412', 800: '#7C2D12', 900: '#5E2410',
        },
        // Neutros "grafito" con un toque cálido (taller, no hospital)
        ink: {
          50: '#F7F6F4', 100: '#EFEDEA', 200: '#E1DED9', 300: '#C9C5BE', 400: '#A09B93',
          500: '#78736B', 600: '#5A564F', 700: '#413E39', 800: '#2B2927', 900: '#1B1A18', 950: '#121110',
        },
        ok:     { 50: '#ECFDF3', 100: '#D1FADF', 700: '#15803D' },
        warn:   { 50: '#FFFBEB', 100: '#FEF0C7', 700: '#A16207' },
        danger: { 50: '#FEF2F2', 100: '#FEE2E2', 600: '#DC2626', 700: '#B91C1C' },
      },
      fontFamily: {
        sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
        display: ['"Barlow Condensed"', '"Hanken Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: { control: '0.625rem', surface: '0.875rem' },
      boxShadow: {
        card: '0 1px 2px rgb(27 26 24 / 0.05), 0 1px 3px rgb(27 26 24 / 0.04)',
        pop: '0 8px 24px -8px rgb(27 26 24 / 0.18), 0 2px 6px rgb(27 26 24 / 0.06)',
      },
      // Sobrescribe `ease-out` con una curva más enérgica (la nativa es débil)
      transitionTimingFunction: { out: 'cubic-bezier(0.23, 1, 0.32, 1)' },
      transitionDuration: { press: '140ms', ui: '180ms' },
      keyframes: {
        rise: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fade: { from: { opacity: '0' }, to: { opacity: '1' } },
      },
      animation: {
        rise: 'rise 260ms cubic-bezier(0.23, 1, 0.32, 1) both',
        fade: 'fade 200ms ease both',
        'spin-fast': 'spin 600ms linear infinite',
      },
    },
  },
  plugins: [],
};
