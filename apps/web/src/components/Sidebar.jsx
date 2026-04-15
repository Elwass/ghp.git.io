const navItems = [
  'Dashboard',
  'Accounts',
  'Automations',
  'Bulk Posting',
  'Analytics',
  'Settings'
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">AMOREF</div>
      <nav>
        <ul>
          {navItems.map((item, index) => (
            <li key={item} className={index === 0 ? 'active' : ''}>
              {item}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
