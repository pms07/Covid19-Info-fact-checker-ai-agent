import type { Metadata } from "next"
import Dashboard from "@/components/dashboard"

export const metadata: Metadata = {
  title: "Vaccine Hesitancy Simulation Lab",
  description: "Interactive simulation of agent behavior in response to vaccine-related news",
}

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Dashboard />
    </main>
  )
}
