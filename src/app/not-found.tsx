import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <p className="text-6xl font-bold text-gray-100 mb-4">404</p>
        <h1 className="text-xl font-semibold text-gray-700 mb-2">Page not found</h1>
        <p className="text-sm text-gray-400 mb-6">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/dashboard/overview" className="btn-primary inline-flex">
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
