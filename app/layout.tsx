import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { MaintenanceProvider } from "@/components/maintenance-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "LinuxWorld Classroom",
  description: "LinuxWorld's comprehensive classroom group management platform",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <MaintenanceProvider>{children}</MaintenanceProvider>
          </AuthProvider>
      </body>
    </html>
  )
}
