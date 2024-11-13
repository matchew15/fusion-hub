import { escrowService } from '../services/escrow';

export class AutoReleaseJob {
  private interval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

  start() {
    if (this.interval) {
      return;
    }

    console.info('Starting auto-release job');
    this.interval = setInterval(async () => {
      try {
        await escrowService.checkAndProcessAutoReleases();
      } catch (error) {
        console.error('Auto-release job error:', error);
      }
    }, this.CHECK_INTERVAL);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.info('Stopped auto-release job');
    }
  }
}

export const autoReleaseJob = new AutoReleaseJob();
