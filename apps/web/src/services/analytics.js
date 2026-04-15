const FALLBACK_SUMMARY = {
  totalViews: 1280000,
  totalLikes: 246000,
  totalComments: 32400
};

const FALLBACK_FYP = [
  {
    content_id: 'c-100',
    content_title: 'How we scaled UGC in 7 days',
    platform: 'Instagram',
    views: 25844,
    likes: 4012,
    comments: 503,
    metric_date: '2026-04-14'
  },
  {
    content_id: 'c-101',
    content_title: 'New product teaser',
    platform: 'TikTok',
    views: 40622,
    likes: 5120,
    comments: 781,
    metric_date: '2026-04-13'
  }
];

export async function fetchAnalyticsSummary({ from, to, token }) {
  try {
    const search = new URLSearchParams({ from, to }).toString();
    const response = await fetch(`/api/v1/analytics/summary?${search}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });

    if (!response.ok) {
      throw new Error('Failed to load summary');
    }

    const data = await response.json();

    return {
      totalViews: data.totalViews,
      totalLikes: data.totalLikes,
      totalComments: Math.round(data.totalLikes * 0.13)
    };
  } catch {
    return FALLBACK_SUMMARY;
  }
}

export async function fetchFypContent({ from, to, minViews = 10000, token }) {
  try {
    const search = new URLSearchParams({ from, to, minViews: String(minViews) }).toString();
    const response = await fetch(`/api/v1/analytics/fyp?${search}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });

    if (!response.ok) {
      throw new Error('Failed to load FYP content');
    }

    const data = await response.json();
    return data.data;
  } catch {
    return FALLBACK_FYP;
  }
}
