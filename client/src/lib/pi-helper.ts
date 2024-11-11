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

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const REQUIRED_SCOPES = ['payments'];

class PiHelper {
  private sdk: PiNetwork | null = null;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;
  private initializationError: Error | null = null;

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private formatError(error: any, context: string): PiError {
    const formattedError = new Error() as PiError;
    formattedError.name = 'PiSDKError';
    formattedError.message = error?.message || `Pi SDK Error: ${context}`;
    formattedError.code = error?.code || 'SDK_ERROR';
    formattedError.details = error?.details;
    
    console.error(`Pi SDK Error (${context}):`, {
      message: formattedError.message,
      code: formattedError.code,
      details: formattedError.details,
      context
    });

    return formattedError;
  }

  isPiBrowser(): boolean {
    return typeof window !== 'undefined' && 'Pi' in window;
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    if (!this.isPiBrowser()) {
      throw this.formatError(
        { message: 'Pi SDK not available. Please use Pi Browser.' },
        'Browser Check'
      );
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = new Promise(async (resolve, reject) => {
      try {
        this.sdk = window.Pi!;
        await this.sdk.init({
          version: "2.0",
          sandbox: process.env.NODE_ENV !== "production"
        });
        
        console.info('Pi SDK initialized successfully', {
          environment: process.env.NODE_ENV,
          sandbox: process.env.NODE_ENV !== "production"
        });
        
        this.initialized = true;
        resolve();
      } catch (error) {
        const formattedError = this.formatError(error, 'Initialization');
        this.initializationError = formattedError;
        reject(formattedError);
      }
    });

    return this.initializationPromise;
  }

  async authenticate(): Promise<{ uid: string; accessToken: string }> {
    if (!this.isPiBrowser()) {
      throw this.formatError(
        { message: 'Authentication failed. Please use Pi Browser.' },
        'Browser Check'
      );
    }

    if (!this.initialized) {
      await this.init();
    }

    try {
      console.info('Starting Pi authentication with scopes:', REQUIRED_SCOPES);
      const auth = await this.sdk!.authenticate(
        REQUIRED_SCOPES,
        { onIncompletePaymentFound: this.handleIncompletePayment.bind(this) }
      );

      if (!auth?.user?.uid || !auth?.accessToken) {
        throw this.formatError(
          { message: 'Invalid authentication response' },
          'Authentication Response'
        );
      }

      console.info('Authentication successful', { uid: auth.user.uid });
      return {
        uid: auth.user.uid,
        accessToken: auth.accessToken
      };
    } catch (error) {
      throw this.formatError(error, 'Authentication');
    }
  }

  async createPayment(payment: PiPayment): Promise<PiPayment> {
    if (!this.isPiBrowser()) {
      throw this.formatError(
        { message: 'Payment creation failed. Please use Pi Browser.' },
        'Payment Creation'
      );
    }

    if (!this.initialized) {
      await this.init();
    }

    try {
      console.info('Creating payment:', payment);
      const paymentData = await this.sdk!.createPayment({
        amount: payment.amount,
        memo: payment.memo,
        metadata: payment.metadata
      });
      
      console.info('Payment created successfully:', paymentData);
      return paymentData;
    } catch (error) {
      throw this.formatError(error, 'Payment Creation');
    }
  }

  private async handleIncompletePayment(payment: PiPayment): Promise<void> {
    try {
      console.info('Handling incomplete payment:', payment);
      if (!payment.identifier) {
        throw new Error('Payment identifier missing');
      }
      
      await this.sdk!.completePayment(payment.identifier);
      console.info('Incomplete payment handled successfully');
    } catch (error) {
      throw this.formatError(error, 'Incomplete Payment');
    }
  }
}

export const piHelper = new PiHelper();
