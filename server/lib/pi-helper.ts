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

class PiHelper {
  private sdk: PiNetwork | null = null;
  private initialized = false;

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

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.sdk?.init({
        version: "2.0",
        sandbox: process.env.NODE_ENV !== "production"
      });
      
      console.info('Pi SDK initialized successfully', {
        environment: process.env.NODE_ENV,
        sandbox: process.env.NODE_ENV !== "production"
      });
      
      this.initialized = true;
    } catch (error) {
      throw this.formatError(error, 'Initialization');
    }
  }

  async createPayment(payment: PiPayment): Promise<PiPayment> {
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

  async completePayment(identifier: string): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }

    try {
      console.info('Completing payment:', identifier);
      await this.sdk!.completePayment(identifier);
      console.info('Payment completed successfully');
    } catch (error) {
      throw this.formatError(error, 'Complete Payment');
    }
  }
}

export const piHelper = new PiHelper();
