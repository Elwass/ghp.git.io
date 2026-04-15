export function AccountsTable({ items }) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Handle</th>
          <th>Platform</th>
          <th>Status</th>
          <th>Followers</th>
        </tr>
      </thead>
      <tbody>
        {items.map((account) => (
          <tr key={account.handle}>
            <td>{account.handle}</td>
            <td>{account.platform}</td>
            <td>
              <span className={`badge badge-${account.status.toLowerCase()}`}>{account.status}</span>
            </td>
            <td>{account.followers.toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
