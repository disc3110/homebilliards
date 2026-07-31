const modules = [
  { name: "Quotes", status: "Foundation ready" },
  { name: "Content and SEO", status: "Foundation ready" },
  { name: "Feed overrides", status: "Foundation ready" },
];

export default function AdminHome() {
  return (
    <main className="admin-shell">
      <aside className="sidebar">
        <span className="wordmark">Home Billiards</span>
        <span className="app-label">Admin</span>
      </aside>
      <section className="workspace">
        <header className="page-header">
          <div>
            <p className="eyebrow">Development environment</p>
            <h1>Operations</h1>
          </div>
          <span className="status">System foundation ready</span>
        </header>
        <div
          className="module-list"
          aria-label="Planned administration modules"
        >
          {modules.map((module) => (
            <div className="module-row" key={module.name}>
              <span>{module.name}</span>
              <span>{module.status}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
