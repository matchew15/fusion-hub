// Type definitions for Pi Network SDK
interface PiNetwork {
  init(config: { version: string; sandbox?: boolean }): Promise<void>;
  authenticate(
    scopes: string[],
    options: { onIncompletePaymentFound: (payment: PiPayment) => Promise<void> }
  ): Promise<{ accessToken: string; user: { uid: string } }>;
  createPayment(payment: {
    amount: number;
    memo: string;
    metadata: Record<string, any>;
  }): Promise<PiPayment>;
  completePayment(identifier: string): Promise<void>;
}

interface PiPayment {
  amount: number;
  memo: string;
  metadata: Record<string, any>;
  identifier?: string;
}

interface PiError extends Error {
  code?: string;
  details?: any;
}

interface PiUserData {
  uid: string;
  username: string;
  roles: string[];
}

declare global {
  interface Window {
    Pi?: PiNetwork;
  }
}