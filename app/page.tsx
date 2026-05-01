import { GoalsTable } from "@/components/goals-table"

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-5">
          <h1 className="text-xl font-semibold text-primary">Team Goals</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Track progress across team members and their objectives
          </p>
        </div>
        <GoalsTable />
      </div>
    </main>
  )
}
