import { Link } from 'react-router-dom'

function DashboardActionCard({ title, description, buttonLabel, to }) {
  return (
    <section className="dashboard-action-card">
      <div>
        <p className="eyebrow">Quick action</p>
        <h2>{title}</h2>
        <p className="subtitle">{description}</p>
      </div>
      <Link to={to} className="primary-button inline-button">
        {buttonLabel}
      </Link>
    </section>
  )
}

export default DashboardActionCard
