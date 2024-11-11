export const theme = {
  colors: {
    neonBlue: 'hsl(170, 85%, 50%)',
    neonPurple: 'hsl(280, 85%, 50%)',
    neonPink: 'hsl(320, 85%, 50%)',
    darkBg: 'hsl(240, 10%, 3.9%)',
    darkCard: 'hsl(240, 10%, 7%)',
  },
  effects: {
    neonGlow: (color: string) => `
      box-shadow: 0 0 2px ${color},
                 0 0 5px ${color},
                 0 0 8px ${color},
                 0 0 10px ${color}; 
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      &:hover {
        box-shadow: 0 0 4px ${color},
                   0 0 8px ${color},
                   0 0 12px ${color},
                   0 0 16px ${color};
      }
    `,
    holographicGradient: `
      background: linear-gradient(
        45deg,
        hsla(170, 85%, 50%, 0.12),
        hsla(280, 85%, 50%, 0.12),
        hsla(320, 85%, 50%, 0.12)
      );
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      &:hover {
        background: linear-gradient(
          45deg,
          hsla(170, 85%, 50%, 0.2),
          hsla(280, 85%, 50%, 0.2),
          hsla(320, 85%, 50%, 0.2)
        );
      }
    `,
  },
};
