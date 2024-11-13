import { Request, Response, NextFunction } from 'express';

export const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      message: 'Authentication required',
      code: 'NOT_AUTHENTICATED'
    });
  }
  next();
};
