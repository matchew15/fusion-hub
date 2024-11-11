// Type definitions for Pi Network SDK
interface PiNetwork {
  init(config: { version: string; sandbox?: boolean }): Promise<void>;
  authenticate(
    scopes: string[],
    options: { onIncompletePaymentFound: (payment: PiPayment) => Promise<void> }
  ): Promise<{ user: { uid: string } }>;
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

declare global {
  interface Window {
    Pi?: PiNetwork;
  }
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const REQUIRED_SCOPES = ['username', 'payments', 'wallet_address'];

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
    formattedError.message = error?.message || 'Unknown error occurred';
    formattedError.code = error?.code;
    formattedError.details = error?.details;
    formattedError.stack = error?.stack;
    
    // Log detailed error information
    console.error(`Pi SDK Error (${context}):`, {
      message: formattedError.message,
      code: formattedError.code,
      details: formattedError.details,
      stack: formattedError.stack,
      context
    });

    return formattedError;
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    retries = MAX_RETRIES,
    context: string = ''
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = this.formatError(error, `${context} (Attempt ${attempt}/${retries + 1})`);
        
        if (attempt <= retries) {
          console.warn(`Retrying operation (${context}), attempt ${attempt + 1}/${retries + 1}`);
          await this.delay(RETRY_DELAY * attempt);
        }
      }
    }
    
    throw lastError;
  }

  isPiBrowser(): boolean {
    return typeof window !== 'undefined' && 'Pi' in window;
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    if (this.initializationError) {
      throw this.initializationError;
    }

    if (!this.isPiBrowser()) {
      this.initializationError = new Error(
        'Pi SDK not available. Please open this application in the Pi Browser.'
      );
      throw this.initializationError;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.retryOperation(async () => {
      try {
        this.sdk = window.Pi!;
        const config = {
          version: "2.0",
          sandbox: process.env.NODE_ENV !== "production"
        };
        await this.sdk.init(config);
        this.initialized = true;
        this.initializationError = null;
        console.info('Pi SDK initialized successfully');
      } catch (error: any) {
        this.initializationError = this.formatError(
          error,
          'SDK Initialization'
        );
        throw this.initializationError;
      }
    }, MAX_RETRIES, 'initialization');

    return this.initializationPromise;
  }

  async authenticate(): Promise<string> {
    if (!this.isPiBrowser()) {
      throw new Error('Authentication failed. Please use Pi Browser.');
    }

    if (!this.initialized) {
      console.info('Initializing Pi SDK before authentication');
      await this.init();
    }

    return this.retryOperation(async () => {
      try {
        console.info('Starting Pi authentication with scopes:', REQUIRED_SCOPES);
        const auth = await this.sdk!.authenticate(REQUIRED_SCOPES, {
          onIncompletePaymentFound: this.handleIncompletePayment.bind(this)
        });
        
        if (!auth?.user?.uid) {
          throw new Error('Authentication response missing user ID');
        }
        
        console.info('Pi authentication successful');
        return auth.user.uid;
      } catch (error: any) {
        throw this.formatError(error, 'Authentication');
      }
    }, MAX_RETRIES, 'authentication');
  }

  async createPayment(payment: PiPayment) {
    if (!this.isPiBrowser()) {
      throw new Error('Payment creation failed. Please use Pi Browser.');
    }

    if (!this.initialized) {
      await this.init();
    }

    return this.retryOperation(async () => {
      try {
        console.info('Creating payment:', payment);
        const paymentData = await this.sdk!.createPayment({
          amount: payment.amount,
          memo: payment.memo,
          metadata: payment.metadata
        });
        console.info('Payment created successfully');
        return paymentData;
      } catch (error: any) {
        throw this.formatError(error, 'Payment Creation');
      }
    }, MAX_RETRIES, 'payment-creation');
  }

  private async handleIncompletePayment(payment: PiPayment) {
    return this.retryOperation(async () => {
      try {
        console.info('Handling incomplete payment:', payment);
        await this.sdk!.completePayment(payment.identifier!);
        console.info('Incomplete payment handled successfully');
      } catch (error: any) {
        throw this.formatError(error, 'Incomplete Payment Handling');
      }
    }, MAX_RETRIES, 'incomplete-payment');
  }
}

export const piHelper = new PiHelper();
