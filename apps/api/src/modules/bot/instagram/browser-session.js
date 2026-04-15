import puppeteer from 'puppeteer';

export class BrowserSession {
  constructor({ headless = true, slowMo = 0 } = {}) {
    this.headless = headless;
    this.slowMo = slowMo;
    this.browser = null;
    this.page = null;
  }

  async start() {
    this.browser = await puppeteer.launch({
      headless: this.headless,
      slowMo: this.slowMo,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 800 });
    return this.page;
  }

  async stop() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}
