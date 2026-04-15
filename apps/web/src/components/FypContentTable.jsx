export function FypContentTable({ items }) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Content</th>
          <th>Platform</th>
          <th>Views</th>
          <th>Likes</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={`${item.content_id}-${item.metric_date}`}>
            <td>{item.content_title}</td>
            <td>{item.platform}</td>
            <td>{Number(item.views).toLocaleString()}</td>
            <td>{Number(item.likes).toLocaleString()}</td>
            <td>{item.metric_date}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
