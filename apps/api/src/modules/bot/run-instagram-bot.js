import { InstagramBot } from './instagram/index.js';
import { logger } from '../../utils/logger.js';

async function main() {
  const username = process.env.IG_USERNAME;
  const password = process.env.IG_PASSWORD;
  const postUrl = process.env.IG_POST_URL;

  if (!username || !password || !postUrl) {
    throw new Error('IG_USERNAME, IG_PASSWORD, and IG_POST_URL are required');
  }

  const bot = new InstagramBot({
    headless: process.env.BOT_HEADLESS !== 'false',
    slowMo: Number(process.env.BOT_SLOW_MO || 0)
  });

  const result = await bot.runLikeAndCommentFlow({
    username,
    password,
    postUrl,
    comments: [
      'Awesome content 🔥',
      'Loved this post 👏',
      'Really insightful 🙌',
      'Great share, thanks!'
    ]
  });

  logger.info('Instagram bot flow completed', result);
}

main().catch((error) => {
  logger.error('Instagram bot flow failed', { error: error.message });
  process.exitCode = 1;
});
