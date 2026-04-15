import { BrowserSession } from './browser-session.js';
import {
  INSTAGRAM_SELECTORS,
  INSTAGRAM_TEXT_BUTTONS
} from './selectors.js';
import { pickRandomComment } from './comment-generator.js';
import { logger } from '../../../utils/logger.js';

async function clickButtonByText(page, text) {
  const clicked = await page.evaluate((targetText) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const button = buttons.find(
      (item) => item.textContent?.trim().toLowerCase() === targetText.toLowerCase()
    );

    if (button) {
      button.click();
      return true;
    }

    return false;
  }, text);

  return clicked;
}

export class InstagramBot {
  constructor({ headless = true, slowMo = 0, timeoutMs = 45000 } = {}) {
    this.session = new BrowserSession({ headless, slowMo });
    this.timeoutMs = timeoutMs;
  }

  async init() {
    this.page = await this.session.start();
    this.page.setDefaultTimeout(this.timeoutMs);
  }

  async login({ username, password }) {
    logger.info('Instagram login started', { username });

    await this.page.goto('https://www.instagram.com/accounts/login/', {
      waitUntil: 'domcontentloaded'
    });

    await this.page.waitForSelector(INSTAGRAM_SELECTORS.usernameInput);
    await this.page.type(INSTAGRAM_SELECTORS.usernameInput, username, { delay: 40 });
    await this.page.type(INSTAGRAM_SELECTORS.passwordInput, password, { delay: 40 });
    await this.page.click(INSTAGRAM_SELECTORS.submitLoginButton);

    await this.page.waitForNavigation({ waitUntil: 'networkidle2' });

    await clickButtonByText(this.page, INSTAGRAM_TEXT_BUTTONS.notNow);

    logger.info('Instagram login successful', { username });
  }

  async openPost(postUrl) {
    logger.info('Opening Instagram post', { postUrl });
    await this.page.goto(postUrl, { waitUntil: 'domcontentloaded' });
    await this.page.waitForSelector('article');
  }

  async likePost() {
    const likeIcon = await this.page.$(INSTAGRAM_SELECTORS.likeButton);

    if (likeIcon) {
      const button = await likeIcon.evaluateHandle((icon) => icon.closest('button'));
      await button.click();
      logger.info('Post liked successfully');
      return true;
    }

    logger.warn('Like button not found');
    return false;
  }

  async commentOnPost({ comments = [] } = {}) {
    const text = pickRandomComment(comments);

    await this.page.waitForSelector(INSTAGRAM_SELECTORS.commentArea);
    await this.page.click(INSTAGRAM_SELECTORS.commentArea);
    await this.page.type(INSTAGRAM_SELECTORS.commentArea, text, { delay: 25 });

    const posted = await clickButtonByText(this.page, INSTAGRAM_TEXT_BUTTONS.post);

    if (!posted) {
      await this.page.keyboard.press('Enter');
    }

    logger.info('Comment posted', { text });
    return text;
  }

  async runLikeAndCommentFlow({ username, password, postUrl, comments = [] }) {
    await this.init();

    try {
      await this.login({ username, password });
      await this.openPost(postUrl);
      await this.likePost();
      const usedComment = await this.commentOnPost({ comments });

      return {
        success: true,
        postUrl,
        usedComment
      };
    } finally {
      await this.close();
    }
  }

  async close() {
    await this.session.stop();
  }
}
