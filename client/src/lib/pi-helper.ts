interface PiPayment {
  amount: number;
  memo: string;
  metadata: Record<string, any>;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

class PiHelper {
  private sdk: any;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    retries = MAX_RETRIES
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retries > 0) {
        await this.delay(RETRY_DELAY);
        return this.retryOperation(operation, retries - 1);
      }
      throw error;
    }
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    // Return existing initialization if in progress
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.retryOperation(async () => {
      if (typeof window === 'undefined' || !window.Pi) {
        throw new Error('Pi SDK not available. Please make sure you are using the Pi Browser.');
      }

      try {
        this.sdk = window.Pi;
        await this.sdk.init({ version: "2.0" });
        this.initialized = true;
      } catch (error) {
        console.error('Failed to initialize Pi SDK:', error);
        throw new Error('Failed to initialize Pi SDK. Please try again.');
      }
    });

    return this.initializationPromise;
  }

  async authenticate(): Promise<string> {
    if (!this.initialized) {
      await this.init();
    }

    return this.retryOperation(async () => {
      try {
        const auth = await this.sdk.authenticate(["payments"], {
          onIncompletePaymentFound: this.handleIncompletePayment.bind(this)
        });
        return auth.user.uid;
      } catch (error: any) {
        console.error('Pi authentication failed:', error);
        throw new Error(
          error.message || 'Failed to authenticate with Pi Network. Please try again.'
        );
      }
    });
  }

  async createPayment(payment: PiPayment) {
    if (!this.initialized) {
      await this.init();
    }

    return this.retryOperation(async () => {
      try {
        const paymentData = await this.sdk.createPayment({
          amount: payment.amount,
          memo: payment.memo,
          metadata: payment.metadata
        });
        return paymentData;
      } catch (error: any) {
        console.error('Payment creation failed:', error);
        throw new Error(
          error.message || 'Failed to create payment. Please try again.'
        );
      }
    });
  }

  private async handleIncompletePayment(payment: any) {
    return this.retryOperation(async () => {
      try {
        await this.sdk.completePayment(payment.identifier);
      } catch (error: any) {
        console.error('Failed to complete payment:', error);
        throw new Error(
          error.message || 'Failed to complete existing payment. Please try again.'
        );
      }
    });
  }
}

export const piHelper = new PiHelper();
