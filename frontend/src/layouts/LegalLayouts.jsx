import { Link } from "react-router-dom"
import logoSimplika from "@/pages/components/landing/images/cover.png"

export default function LegalLayout({ children }) {
  return (
    <div className="min-h-screen bg-white text-gray-900 px-4 py-6 max-w-3xl mx-auto">
      <Link to="/" className="inline-block mb-6">
        <img src={logoSimplika} alt="Simplika" className="h-12 w-auto" />
      </Link>

      <div className="prose prose-gray">{children}</div>
    </div>
  )
}
