interface PiPayment {
  amount: number;
  memo: string;
  metadata: Record<string, any>;
}

class PiHelper {
  private sdk: any;

  async init() {
    if (typeof window.Pi === 'undefined') {
      console.error('Pi SDK not found');
      return;
    }
    this.sdk = window.Pi;
    await this.sdk.init({ version: "2.0" });
  }

  async authenticate(): Promise<string> {
    try {
      const auth = await this.sdk.authenticate(["payments"], {
        onIncompletePaymentFound: this.handleIncompletePayment
      });
      return auth.user.uid;
    } catch (error) {
      console.error('Pi authentication failed:', error);
      throw error;
    }
  }

  async createPayment(payment: PiPayment) {
    try {
      const paymentData = await this.sdk.createPayment({
        amount: payment.amount,
        memo: payment.memo,
        metadata: payment.metadata
      });
      return paymentData;
    } catch (error) {
      console.error('Payment creation failed:', error);
      throw error;
    }
  }

  private async handleIncompletePayment(payment: any) {
    try {
      await this.sdk.completePayment(payment.identifier);
    } catch (error) {
      console.error('Failed to complete payment:', error);
    }
  }
}

export const piHelper = new PiHelper();
