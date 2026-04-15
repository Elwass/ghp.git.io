export function KpiCards({ items }) {
  return (
    <section className="kpi-grid">
      {items.map((item) => (
        <article className="kpi-card" key={item.label}>
          <p className="kpi-label">{item.label}</p>
          <h3>{item.value}</h3>
          <span className="kpi-change">{item.change}</span>
        </article>
      ))}
    </section>
  );
}
