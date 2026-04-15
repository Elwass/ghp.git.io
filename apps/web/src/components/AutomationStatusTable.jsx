export function AutomationStatusTable({ items }) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Automation</th>
          <th>Type</th>
          <th>Queue</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {items.map((task) => (
          <tr key={task.name}>
            <td>{task.name}</td>
            <td>{task.type}</td>
            <td>{task.queue}</td>
            <td>
              <span className={`badge badge-${task.status.toLowerCase()}`}>{task.status}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
