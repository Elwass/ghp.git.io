# Reusable Puppeteer Instagram Bot

This module provides a reusable, modular bot that can:
- login to Instagram
- open a post URL
- like the post
- comment using random text

## Files

```txt
apps/api/src/modules/bot/
├── run-instagram-bot.js
└── instagram/
    ├── browser-session.js
    ├── comment-generator.js
    ├── index.js
    ├── instagram.bot.js
    └── selectors.js
```

## How It Is Modular

- `browser-session.js`: shared browser lifecycle wrapper.
- `selectors.js`: centralized selectors/text constants.
- `comment-generator.js`: reusable random-comment utilities.
- `instagram.bot.js`: main bot class with composable methods:
  - `login()`
  - `openPost()`
  - `likePost()`
  - `commentOnPost()`
  - `runLikeAndCommentFlow()`
- `run-instagram-bot.js`: runnable script wiring env vars + sample comments.

## Usage

```bash
IG_USERNAME="your_username" \
IG_PASSWORD="your_password" \
IG_POST_URL="https://www.instagram.com/p/POST_ID/" \
npm run bot:instagram
```

Optional:
- `BOT_HEADLESS=false`
- `BOT_SLOW_MO=50`

## Notes

Instagram frequently updates selectors and anti-bot defenses. Keep selectors isolated in `selectors.js` and update there when needed.
