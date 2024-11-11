// Type definitions for Pi Network SDK
interface PiNetwork {
  init(config: { version: string }): Promise<void>;
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

declare global {
  interface Window {
    Pi?: PiNetwork;
  }
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

class PiHelper {
  private sdk: PiNetwork | null = null;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;
  private initializationError: Error | null = null;

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    retries = MAX_RETRIES,
    context: string = ''
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      console.error(`Pi SDK error (${context}):`, error);
      if (retries > 0) {
        await this.delay(RETRY_DELAY);
        return this.retryOperation(operation, retries - 1, context);
      }
      throw new Error(`Pi SDK operation failed (${context}): ${error.message}`);
    }
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
        await this.sdk.init({ version: "2.0" });
        this.initialized = true;
        this.initializationError = null;
      } catch (error: any) {
        this.initializationError = new Error(
          'Failed to initialize Pi Network SDK. Please check your connection.'
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
      await this.init();
    }

    return this.retryOperation(async () => {
      try {
        const auth = await this.sdk!.authenticate(["payments"], {
          onIncompletePaymentFound: this.handleIncompletePayment.bind(this)
        });
        return auth.user.uid;
      } catch (error: any) {
        throw new Error(
          error.message || 'Pi Network authentication failed. Please try again.'
        );
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
        const paymentData = await this.sdk!.createPayment({
          amount: payment.amount,
          memo: payment.memo,
          metadata: payment.metadata
        });
        return paymentData;
      } catch (error: any) {
        throw new Error(
          error.message || 'Payment creation failed. Please try again.'
        );
      }
    }, MAX_RETRIES, 'payment-creation');
  }

  private async handleIncompletePayment(payment: PiPayment) {
    return this.retryOperation(async () => {
      try {
        await this.sdk!.completePayment(payment.identifier!);
      } catch (error: any) {
        throw new Error(
          error.message || 'Failed to complete existing payment.'
        );
      }
    }, MAX_RETRIES, 'incomplete-payment');
  }
}

export const piHelper = new PiHelper();
