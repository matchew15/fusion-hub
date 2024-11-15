export const theme = {
  colors: {
    neonBlue: 'hsl(170, 85%, 50%)',
    neonPurple: 'hsl(280, 85%, 50%)',
    neonPink: 'hsl(320, 85%, 50%)',
    darkBg: 'hsl(240, 10%, 3.9%)',
    darkCard: 'hsl(240, 10%, 7%)',
  },
  effects: {
    // Standardized animation durations
    durations: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
    },
    neonGlow: (color: string) => `
      box-shadow: 0 0 2px ${color},
                 0 0 4px ${color},
                 0 0 6px ${color};
      transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
      &:hover {
        box-shadow: 0 0 4px ${color},
                   0 0 8px ${color},
                   0 0 12px ${color};
        transform: translateY(-2px);
      }
      &:active {
        transform: translateY(0);
      }
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `,
    holographicGradient: `
      background: linear-gradient(
        45deg,
        hsla(170, 85%, 50%, 0.08),
        hsla(280, 85%, 50%, 0.08),
        hsla(320, 85%, 50%, 0.08)
      );
      transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
      &:hover {
        background: linear-gradient(
          45deg,
          hsla(170, 85%, 50%, 0.12),
          hsla(280, 85%, 50%, 0.12),
          hsla(320, 85%, 50%, 0.12)
        );
        transform: translateY(-2px);
      }
      &:active {
        transform: translateY(0);
      }
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `,
    interactiveTransition: `
      transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
      &:hover {
        transform: translateY(-2px);
      }
      &:active {
        transform: translateY(0);
      }
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `,
    glassmorphism: `
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 
                 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
    `,
  },
};
