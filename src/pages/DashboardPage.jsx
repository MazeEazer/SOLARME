// DashboardPage.jsx
import { Link } from "react-router-dom"

export default function DashboardPage() {
  return (
    <div className="dashboard">
      <div className="brand-title">SÓLAR ME</div>

      <div className="dashboard-content">
        <div className="cards">
          <Link to="/tracker" className="card-button accent">
            Заполнить день
          </Link>
          <Link to="/analytics" className="card-button">
            Аналитика
          </Link>
          <Link to="/biohacks" className="card-button">
            Биохаки
          </Link>
        </div>
      </div>
    </div>
  )
}
