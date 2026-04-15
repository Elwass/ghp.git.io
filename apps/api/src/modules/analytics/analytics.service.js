import { db } from '../../db/pool.js';

function normalizeDateRange({ from, to }) {
  const fromDate = from || '1970-01-01';
  const toDate = to || '2999-12-31';
  return { fromDate, toDate };
}

export async function getAnalyticsSummary(tenantId, params = {}) {
  const { fromDate, toDate } = normalizeDateRange(params);

  const result = await db.query(
    `
      SELECT
        COALESCE(SUM(views), 0) AS total_views,
        COALESCE(SUM(likes), 0) AS total_likes
      FROM content_metrics
      WHERE tenant_id = $1
        AND metric_date BETWEEN $2::date AND $3::date
    `,
    [tenantId, fromDate, toDate]
  );

  return {
    totalViews: Number(result.rows[0].total_views),
    totalLikes: Number(result.rows[0].total_likes)
  };
}

export async function getFypContent(tenantId, params = {}) {
  const { fromDate, toDate } = normalizeDateRange(params);
  const minViews = Number(params.minViews || 10000);

  const result = await db.query(
    `
      SELECT
        content_id,
        content_title,
        platform,
        views,
        likes,
        comments,
        metric_date
      FROM content_metrics
      WHERE tenant_id = $1
        AND metric_date BETWEEN $2::date AND $3::date
        AND views > $4
      ORDER BY views DESC
      LIMIT 100
    `,
    [tenantId, fromDate, toDate, minViews]
  );

  return result.rows;
}
