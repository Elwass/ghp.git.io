import { Sidebar } from './components/Sidebar.jsx';
import { KpiCards } from './components/KpiCards.jsx';
import { AccountsTable } from './components/AccountsTable.jsx';
import { AutomationStatusTable } from './components/AutomationStatusTable.jsx';

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

const kpis = [
  { label: 'Views', value: '1.28M', change: '+8.3%' },
  { label: 'Likes', value: '246K', change: '+5.9%' },
  { label: 'Comments', value: '32.4K', change: '+3.2%' }
];

export default function App() {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="content">
        <header className="content-header">
          <h1>AMOREF Dashboard</h1>
          <p>Multi-account overview and automation operations.</p>
        </header>

        <KpiCards items={kpis} />

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
