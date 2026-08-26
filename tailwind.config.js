/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: '1rem',
    },
    extend: {
      colors: {
        background: { DEFAULT: 'var(--background)' },
        foreground: { DEFAULT: 'var(--foreground)' },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        border: { DEFAULT: 'var(--border)' },
        input: { DEFAULT: 'var(--input)' },
        ring: { DEFAULT: 'var(--ring)' },
        navy: {
          deep: 'var(--navy-deep)',
          mid: 'var(--navy-mid)',
          light: 'var(--navy-light)',
        },
        steel: { DEFAULT: 'var(--steel)' },
        amber: {
          DEFAULT: 'var(--amber)',
          light: 'var(--amber-light)',
          dark: 'var(--amber-dark)',
        },
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        sm: 'calc(var(--radius) - 0.5rem)',
        lg: 'calc(var(--radius) + 0.5rem)',
        xl: 'calc(var(--radius) + 1rem)',
        '2xl': 'calc(var(--radius) + 1.5rem)',
        '4xl': '2.5rem',
        '5xl': '3rem',
      },
      fontFamily: {
        sans: ['var(--font-plus-jakarta-sans)', 'sans-serif'],
        display: ['var(--font-plus-jakarta-sans)', 'sans-serif'],
        body: ['var(--font-dm-sans)', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 20px rgba(11, 25, 41, 0.06)',
        'card-hover': '0 24px 48px -12px rgba(11, 25, 41, 0.15)',
        amber: '0 12px 24px -6px rgba(245, 158, 11, 0.4)',
        navy: '0 12px 24px -6px rgba(11, 25, 41, 0.3)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
