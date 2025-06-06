import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="text-center text-sm">
      <Link href="/forgot-password" className="text-primary hover:underline">
        Forgot Password?
      </Link>
    </div>
  )
} 