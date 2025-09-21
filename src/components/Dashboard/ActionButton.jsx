import { Link } from "react-router-dom"

export default function ActionButton({ to, children, accent }) {
  return (
    <Link to={to} className={`card-button ${accent ? "accent" : ""}`}>
      {children}
    </Link>
  )
}
