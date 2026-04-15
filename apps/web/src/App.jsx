import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from './components/Sidebar.jsx';
import { KpiCards } from './components/KpiCards.jsx';
import { AccountsTable } from './components/AccountsTable.jsx';
import { AutomationStatusTable } from './components/AutomationStatusTable.jsx';
import { FypContentTable } from './components/FypContentTable.jsx';
import { fetchAnalyticsSummary, fetchFypContent } from './services/analytics.js';

const accounts = [
  { handle: '@amoref_brand', platform: 'Instagram', status: 'Active', followers: 12500 },
  { handle: '@amoref_global', platform: 'Instagram', status: 'Active', followers: 9200 },
  { handle: '@amoref_shop', platform: 'TikTok', status: 'Paused', followers: 18300 },
  { handle: '@amoref_support', platform: 'X', status: 'Active', followers: 5400 }
];

const automations = [
  { name: 'Morning Like Run', type: 'Like', queue: 'engagement.normal', status: 'Running' },
  { name: 'Comment Campaign A', type: 'Comment', queue: 'engagement.high', status: 'Queued' },
  { name: 'Follow Target Set #12', type: 'Follow', queue: 'engagement.normal', status: 'Completed' },
  { name: 'Product Launch Post', type: 'Post', queue: 'posting.scheduled', status: 'Failed' }
];

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

export default function App() {
  const [fromDate, setFromDate] = useState(formatDate(new Date(Date.now() - 6 * 86400000)));
  const [toDate, setToDate] = useState(formatDate(new Date()));
  const [summary, setSummary] = useState({ totalViews: 0, totalLikes: 0, totalComments: 0 });
  const [fypContent, setFypContent] = useState([]);

  useEffect(() => {
    async function loadAnalytics() {
      const [summaryData, fypData] = await Promise.all([
        fetchAnalyticsSummary({ from: fromDate, to: toDate }),
        fetchFypContent({ from: fromDate, to: toDate, minViews: 10000 })
      ]);

      setSummary(summaryData);
      setFypContent(fypData);
    }

    loadAnalytics();
  }, [fromDate, toDate]);

  const kpis = useMemo(
    () => [
      { label: 'Views', value: summary.totalViews.toLocaleString(), change: 'Date-filtered' },
      { label: 'Likes', value: summary.totalLikes.toLocaleString(), change: 'Date-filtered' },
      { label: 'Comments', value: summary.totalComments.toLocaleString(), change: 'Date-filtered' }
    ],
    [summary]
  );

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="content">
        <header className="content-header">
          <h1>AMOREF Dashboard</h1>
          <p>Multi-account overview, automation operations, and analytics insights.</p>
        </header>

        <section className="panel filters-row">
          <div className="field">
            <label htmlFor="fromDate">From</label>
            <input id="fromDate" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="toDate">To</label>
            <input id="toDate" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
        </section>

        <KpiCards items={kpis} />

        <section className="panel">
          <div className="panel-header">
            <h2>FYP Content (Views &gt; 10,000)</h2>
          </div>
          <FypContentTable items={fypContent} />
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Account List</h2>
          </div>
          <AccountsTable items={accounts} />
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Automation Status</h2>
          </div>
          <AutomationStatusTable items={automations} />
        </section>
      </main>
    </div>
  );
}
