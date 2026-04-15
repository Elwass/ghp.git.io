# AMOREF React Dashboard

Implemented a minimal, professional, light-blue dashboard with:
- Sidebar navigation
- Account list table
- Automation status table
- KPI cards (views, likes, comments)
- FYP content table (views > 10,000)
- Date filter integration for analytics API

## Location
- `apps/web/src/App.jsx`
- `apps/web/src/components/*`
- `apps/web/src/services/analytics.js`
- `apps/web/src/styles.css`

## Integrated Analytics API
- `GET /api/v1/analytics/summary?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /api/v1/analytics/fyp?from=YYYY-MM-DD&to=YYYY-MM-DD&minViews=10000`

## Run
```bash
cd apps/web
npm install
npm run dev
```
