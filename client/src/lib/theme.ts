export const theme = {
  colors: {
    neonBlue: 'hsl(170, 100%, 50%)',
    neonPurple: 'hsl(280, 100%, 50%)',
    neonPink: 'hsl(320, 100%, 50%)',
    darkBg: 'hsl(240, 10%, 3.9%)',
    darkCard: 'hsl(240, 10%, 7%)',
  },
  effects: {
    neonGlow: (color: string) => `
      box-shadow: 0 0 5px ${color},
                 0 0 10px ${color},
                 0 0 15px ${color},
                 0 0 20px ${color}; 
      transition: box-shadow 0.3s ease-in-out;
      &:hover {
        box-shadow: 0 0 8px ${color},
                   0 0 16px ${color},
                   0 0 24px ${color},
                   0 0 32px ${color};
      }
    `,
    holographicGradient: `
      background: linear-gradient(
        45deg,
        hsla(170, 100%, 50%, 0.15),
        hsla(280, 100%, 50%, 0.15),
        hsla(320, 100%, 50%, 0.15)
      );
      transition: background 0.3s ease-in-out;
      &:hover {
        background: linear-gradient(
          45deg,
          hsla(170, 100%, 50%, 0.25),
          hsla(280, 100%, 50%, 0.25),
          hsla(320, 100%, 50%, 0.25)
        );
      }
    `,
  },
};
