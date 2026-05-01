"use client"

import { useState, useEffect, useRef } from "react"
import { Check, X, HelpCircle, Briefcase, Plus, MoreHorizontal, Trash2, User, Pencil, Camera } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

type Status = "accomplished" | "half" | "not-accomplished" | "unclear" | "work-prohibited"

interface CtmPeriod {
  id: string
  name: string
}

interface Person {
  id: string
  name: string
  goals: string[]
  photo?: string
}

interface StatusEntry {
  personId: string
  goalIndex: number
  ctmPeriodId: string
  status: Status
}

const statusConfig: Record<Status, { icon: React.ReactNode; label: string; iconOnly: React.ReactNode }> = {
  accomplished: {
    icon: <Check className="h-3.5 w-3.5 text-primary" />,
    iconOnly: <Check className="h-3.5 w-3.5 text-primary" />,
    label: "Accomplished",
  },
  half: {
    icon: <Check className="h-3.5 w-3.5 text-yellow-500" />,
    iconOnly: <Check className="h-3.5 w-3.5 text-yellow-500" />,
    label: "50% Close",
  },
  "not-accomplished": {
    icon: <X className="h-3.5 w-3.5 text-muted-foreground" />,
    iconOnly: <X className="h-3.5 w-3.5 text-muted-foreground" />,
    label: "Did Not Accomplish",
  },
  unclear: {
    icon: <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />,
    iconOnly: <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />,
    label: "Status Unclear",
  },
  "work-prohibited": {
    icon: <Briefcase className="h-3.5 w-3.5 text-red-500" />,
    iconOnly: <Briefcase className="h-3.5 w-3.5 text-red-500" />,
    label: "Work Prohibited Me",
  },
}

const defaultPeople: Person[] = [
  { id: "1", name: "Jack", goals: ["Bedtime with boys 3x per week", "Healthy eating 5x per week"] },
  { id: "2", name: "Crystal", goals: ["Kendo 1x during workweek (when in-town)", "Dinner with my fiancé 3x/week (when in-town)"] },
  { id: "3", name: "Jake", goals: ["Workout 3x/week before work", "Cook dinner w/ Kat 2x/week"] },
  { id: "4", name: "Lorraine", goals: ["Workout 5x week", "Try a new place in ATL/week"] },
  { id: "5", name: "Taylor", goals: ["Workout 3-4x/week", "Date night 1x/week"] },
  { id: "6", name: "Will", goals: ["Workout 4x during week", "Eat dinner with Taylor 1x during week"] },
  { id: "7", name: "Sebastian", goals: ["Dinner w/ my SO 1x per week", "Workout 3x+ per week"] },
]

const defaultCtmPeriods: CtmPeriod[] = [
  { id: "ctm-1", name: "CTM 1" },
]

function StatusSelector({
  status,
  onStatusChange,
  compact = false,
}: {
  status: Status | null
  onStatusChange: (status: Status) => void
  compact?: boolean
}) {
  const currentStatus = status ? statusConfig[status] : null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "hover:bg-accent",
            compact ? "h-7 w-7 p-0" : "h-7 gap-1.5 px-2"
          )}
        >
          {currentStatus ? (
            compact ? currentStatus.iconOnly : (
              <>
                {currentStatus.icon}
                <span className="text-xs text-muted-foreground">{currentStatus.label}</span>
              </>
            )
          ) : (
            <span className="text-xs text-muted-foreground">{compact ? "—" : "Select status"}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {(Object.keys(statusConfig) as Status[]).map((statusKey) => (
          <DropdownMenuItem
            key={statusKey}
            onClick={() => onStatusChange(statusKey)}
            className={cn(
              "gap-2 cursor-pointer text-sm",
              status === statusKey && "bg-accent"
            )}
          >
            {statusConfig[statusKey].icon}
            <span>{statusConfig[statusKey].label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function AddPersonDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (name: string, goals: string[]) => void
}) {
  const [name, setName] = useState("")
  const [goal1, setGoal1] = useState("")
  const [goal2, setGoal2] = useState("")

  const handleSubmit = () => {
    if (name.trim() && (goal1.trim() || goal2.trim())) {
      const goals = [goal1, goal2].filter((g) => g.trim())
      onAdd(name.trim(), goals)
      setName("")
      setGoal1("")
      setGoal2("")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Person</DialogTitle>
          <DialogDescription>Add a new team member and their goals.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter name" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Goal 1</label>
            <Input value={goal1} onChange={(e) => setGoal1(e.target.value)} placeholder="Enter first goal" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Goal 2</label>
            <Input value={goal2} onChange={(e) => setGoal2(e.target.value)} placeholder="Enter second goal (optional)" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90">Add Person</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditGoalsDialog({
  open, onOpenChange, person, onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  person: Person | null
  onSave: (personId: string, goals: string[]) => void
}) {
  const [goals, setGoals] = useState<string[]>([])

  useEffect(() => {
    if (person) setGoals([...person.goals])
  }, [person])

  const handleSave = () => {
    if (person) {
      const filteredGoals = goals.filter((g) => g.trim())
      if (filteredGoals.length > 0) {
        onSave(person.id, filteredGoals)
        onOpenChange(false)
      }
    }
  }

  if (!person) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Goals for {person.name}</DialogTitle>
          <DialogDescription>Update, add, or remove goals.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-3">
          {goals.map((goal, index) => (
            <div key={index} className="flex gap-2">
              <Input value={goal} onChange={(e) => {
                const newGoals = [...goals]
                newGoals[index] = e.target.value
                setGoals(newGoals)
              }} placeholder={`Goal ${index + 1}`} />
              <Button variant="ghost" size="icon" onClick={() => {
                if (goals.length > 1) setGoals(goals.filter((_, i) => i !== index))
              }} disabled={goals.length <= 1}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" onClick={() => setGoals([...goals, ""])} className="w-full">
            <Plus className="h-4 w-4 mr-2" />Add Goal
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RenamePersonDialog({
  open, onOpenChange, person, onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  person: Person | null
  onSave: (personId: string, newName: string) => void
}) {
  const [name, setName] = useState("")

  useEffect(() => {
    if (person) setName(person.name)
  }, [person])

  if (!person) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Person</DialogTitle>
          <DialogDescription>Update the display name for this team member.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter name" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { if (name.trim()) { onSave(person.id, name.trim()); onOpenChange(false) } }} className="bg-primary hover:bg-primary/90">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AddCtmPeriodDialog({
  open, onOpenChange, onAdd,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (name: string) => void
}) {
  const [name, setName] = useState("")

  useEffect(() => { if (open) setName("") }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New CTM Period</DialogTitle>
          <DialogDescription>Enter a name for the new period.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Period Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Week of Apr 21"
              onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) { onAdd(name.trim()); onOpenChange(false) } }} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { if (name.trim()) { onAdd(name.trim()); onOpenChange(false) } }} className="bg-primary hover:bg-primary/90">Create Period</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RenameCtmPeriodDialog({
  open, onOpenChange, period, onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  period: CtmPeriod | null
  onSave: (periodId: string, newName: string) => void
}) {
  const [name, setName] = useState("")

  useEffect(() => { if (period) setName(period.name) }, [period])

  if (!period) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Period</DialogTitle>
          <DialogDescription>Update the name for this CTM period.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Period Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter period name"
              onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) { onSave(period.id, name.trim()); onOpenChange(false) } }} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { if (name.trim()) { onSave(period.id, name.trim()); onOpenChange(false) } }} className="bg-primary hover:bg-primary/90">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PersonAvatar({
  person, size = "md", onPhotoUpload,
}: {
  person: Person
  size?: "sm" | "md"
  onPhotoUpload?: () => void
}) {
  const sizeClasses = size === "sm" ? "h-7 w-7 text-xs" : "h-8 w-8 text-sm"

  return (
    <div className="relative group">
      {person.photo ? (
        <img src={person.photo} alt={person.name} className={cn(sizeClasses, "rounded-full object-cover")} />
      ) : (
        <div className={cn(sizeClasses, "rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold")}>
          {person.name.charAt(0)}
        </div>
      )}
      {onPhotoUpload && (
        <button onClick={onPhotoUpload} className={cn(sizeClasses, "absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer")}>
          <Camera className="h-3.5 w-3.5 text-white" />
        </button>
      )}
    </div>
  )
}

export function GoalsTable() {
  const [people, setPeople] = useState<Person[]>([])
  const [ctmPeriods, setCtmPeriods] = useState<CtmPeriod[]>([])
  const [statuses, setStatuses] = useState<StatusEntry[]>([])
  const [currentCtmId, setCurrentCtmId] = useState<string>("")
  const [addPersonDialogOpen, setAddPersonDialogOpen] = useState(false)
  const [editGoalsDialogOpen, setEditGoalsDialogOpen] = useState(false)
  const [renamePersonDialogOpen, setRenamePersonDialogOpen] = useState(false)
  const [addCtmDialogOpen, setAddCtmDialogOpen] = useState(false)
  const [renameCtmDialogOpen, setRenameCtmDialogOpen] = useState(false)
  const [deletePersonAlertOpen, setDeletePersonAlertOpen] = useState(false)
  const [deleteCtmAlertOpen, setDeleteCtmAlertOpen] = useState(false)
  const [editingPerson, setEditingPerson] = useState<Person | null>(null)
  const [editingCtmPeriod, setEditingCtmPeriod] = useState<CtmPeriod | null>(null)
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const lastClickTimeRef = useRef<number>(0)
  const lastClickIdRef = useRef<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingPersonId, setUploadingPersonId] = useState<string | null>(null)

  // Load all data from Supabase on mount
  useEffect(() => {
    async function loadData() {
      // Load people
      const { data: peopleData } = await supabase.from("people").select("*").order("id")
      // Load goals
      const { data: goalsData } = await supabase.from("goals").select("*").order("id")
      // Load ctm_periods
      const { data: periodsData } = await supabase.from("ctm_periods").select("*").order("id")
      // Load statuses
      const { data: statusesData } = await supabase.from("statuses").select("*")
      // Load save_metadata for current period
      const { data: metaData } = await supabase.from("save_metadata").select("*").eq("key", "current_period_id").single()

      if (peopleData && goalsData) {
        const mapped: Person[] = peopleData.map((p: any) => ({
          id: p.id,
          name: p.name,
          photo: p.avatar || undefined,
          goals: goalsData.filter((g: any) => g.person_id === p.id).map((g: any) => g.goal_text),
        }))
        setPeople(mapped.length > 0 ? mapped : defaultPeople)
      } else {
        setPeople(defaultPeople)
      }

      if (periodsData && periodsData.length > 0) {
        const periods: CtmPeriod[] = periodsData.map((p: any) => ({ id: p.id, name: p.name }))
        setCtmPeriods(periods)
        const savedId = metaData?.value
        if (savedId && periods.some((p) => p.id === savedId)) {
          setCurrentCtmId(savedId)
        } else {
          setCurrentCtmId(periods[periods.length - 1].id)
        }
      } else {
        setCtmPeriods(defaultCtmPeriods)
        setCurrentCtmId(defaultCtmPeriods[0].id)
      }

      if (statusesData) {
        const mapped: StatusEntry[] = statusesData.map((s: any) => ({
          personId: s.goal_id?.split("-goal-")[0] ?? "",
          goalIndex: parseInt(s.goal_id?.split("-goal-")[1] ?? "0"),
          ctmPeriodId: s.period_id,
          status: s.status as Status,
        }))
        setStatuses(mapped)
      }

      setIsLoaded(true)
    }
    loadData()
  }, [])

  // Save current period selection to Supabase
  useEffect(() => {
    if (!isLoaded || !currentCtmId) return
    supabase.from("save_metadata").upsert({ key: "current_period_id", value: currentCtmId }, { onConflict: "key" })
  }, [currentCtmId, isLoaded])

  const currentCtm = ctmPeriods.find((p) => p.id === currentCtmId)
  const currentCtmIndex = ctmPeriods.findIndex((p) => p.id === currentCtmId)
  const lastCtm = currentCtmIndex > 0 ? ctmPeriods[currentCtmIndex - 1] : null
  const hasLastCtm = lastCtm !== null

  const getStatus = (personId: string, goalIndex: number, ctmPeriodId: string): Status | null => {
    const entry = statuses.find(
      (s) => s.personId === personId && s.goalIndex === goalIndex && s.ctmPeriodId === ctmPeriodId
    )
    return entry?.status ?? null
  }

  const setStatus = async (personId: string, goalIndex: number, ctmPeriodId: string, status: Status) => {
    // Update local state immediately
    setStatuses((prev) => {
      const existing = prev.findIndex(
        (s) => s.personId === personId && s.goalIndex === goalIndex && s.ctmPeriodId === ctmPeriodId
      )
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = { ...updated[existing], status }
        return updated
      }
      return [...prev, { personId, goalIndex, ctmPeriodId, status }]
    })

    // Save to Supabase
    const goalId = `${personId}-goal-${goalIndex}`
    await supabase.from("statuses").upsert(
      { goal_id: goalId, period_id: ctmPeriodId, status },
      { onConflict: "goal_id,period_id" }
    )
  }

  const handleAddPerson = async (name: string, goals: string[]) => {
    const newId = Date.now().toString()
    const newPerson: Person = { id: newId, name, goals }
    setPeople((prev) => [...prev, newPerson])

    // Save to Supabase
    await supabase.from("people").insert({ id: newId, name })
    for (let i = 0; i < goals.length; i++) {
      await supabase.from("goals").insert({ person_id: newId, goal_text: goals[i] })
    }
  }

  const handleEditGoals = async (personId: string, goals: string[]) => {
    setPeople((prev) => prev.map((p) => (p.id === personId ? { ...p, goals } : p)))

    // Delete old goals and re-insert
    await supabase.from("goals").delete().eq("person_id", personId)
    for (let i = 0; i < goals.length; i++) {
      await supabase.from("goals").insert({ person_id: personId, goal_text: goals[i] })
    }
  }

  const handleRenamePerson = async (personId: string, newName: string) => {
    setPeople((prev) => prev.map((p) => (p.id === personId ? { ...p, name: newName } : p)))
    await supabase.from("people").update({ name: newName }).eq("id", personId)
  }

  const handleDeletePerson = async () => {
    if (personToDelete) {
      setPeople((prev) => prev.filter((p) => p.id !== personToDelete.id))
      setStatuses((prev) => prev.filter((s) => s.personId !== personToDelete.id))
      await supabase.from("goals").delete().eq("person_id", personToDelete.id)
      await supabase.from("people").delete().eq("id", personToDelete.id)
      setPersonToDelete(null)
      setDeletePersonAlertOpen(false)
    }
  }

  const handleAddCtmPeriod = async (name: string) => {
    const newId = `ctm-${Date.now()}`
    const newPeriod: CtmPeriod = { id: newId, name }
    setCtmPeriods((prev) => [...prev, newPeriod])
    setCurrentCtmId(newId)
    await supabase.from("ctm_periods").insert({ id: newId, name })
  }

  const handleRenameCtmPeriod = async (periodId: string, newName: string) => {
    setCtmPeriods((prev) => prev.map((p) => (p.id === periodId ? { ...p, name: newName } : p)))
    await supabase.from("ctm_periods").update({ name: newName }).eq("id", periodId)
  }

  const handleDeleteCtmPeriod = async () => {
    if (currentCtm && ctmPeriods.length > 1) {
      const newPeriods = ctmPeriods.filter((p) => p.id !== currentCtm.id)
      setCtmPeriods(newPeriods)
      setStatuses((prev) => prev.filter((s) => s.ctmPeriodId !== currentCtm.id))
      setCurrentCtmId(newPeriods[newPeriods.length - 1].id)
      await supabase.from("statuses").delete().eq("period_id", currentCtm.id)
      await supabase.from("ctm_periods").delete().eq("id", currentCtm.id)
      setDeleteCtmAlertOpen(false)
    }
  }

  const handlePhotoUpload = (personId: string) => {
    setUploadingPersonId(personId)
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && uploadingPersonId) {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string
        setPeople((prev) => prev.map((p) => (p.id === uploadingPersonId ? { ...p, photo: base64 } : p)))
        await supabase.from("people").update({ avatar: base64 }).eq("id", uploadingPersonId)
        setUploadingPersonId(null)
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ""
  }

  const handlePeriodItemClick = (periodId: string) => {
    const now = Date.now()
    if (lastClickIdRef.current === periodId && now - lastClickTimeRef.current < 300) {
      const period = ctmPeriods.find((p) => p.id === periodId)
      if (period) {
        setEditingCtmPeriod(period)
        setRenameCtmDialogOpen(true)
      }
    } else {
      setCurrentCtmId(periodId)
    }
    lastClickTimeRef.current = now
    lastClickIdRef.current = periodId
  }

  if (!isLoaded) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
        Loading...
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-foreground">View Period:</label>
            <Select value={currentCtmId} onValueChange={(value) => handlePeriodItemClick(value)}>
              <SelectTrigger className="w-44 h-8 text-sm">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {ctmPeriods.map((period) => (
                  <SelectItem key={period.id} value={period.id}>{period.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setAddCtmDialogOpen(true)} title="Add new period">
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { if (currentCtm) { setEditingCtmPeriod(currentCtm); setRenameCtmDialogOpen(true) } }} title="Rename period">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setDeleteCtmAlertOpen(true)} disabled={ctmPeriods.length <= 1} title="Delete period">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button onClick={() => setAddPersonDialogOpen(true)} className="bg-primary hover:bg-primary/90 h-8 text-sm">
            <Plus className="h-3.5 w-3.5 mr-1.5" />Add Person
          </Button>
        </div>

        <div className="space-y-3">
          {people.map((person) => (
            <div key={person.id} className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
              <div className="flex items-stretch">
                <div className="w-1 bg-primary/40 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 px-3 py-2 border-b border-border/40 bg-secondary/30">
                    <PersonAvatar person={person} onPhotoUpload={() => handlePhotoUpload(person.id)} />
                    <span className="font-medium text-sm text-foreground">{person.name}</span>
                    <div className="ml-auto">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditingPerson(person); setEditGoalsDialogOpen(true) }}>
                            <Pencil className="h-3.5 w-3.5 mr-2" />Edit Goals
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setEditingPerson(person); setRenamePersonDialogOpen(true) }}>
                            <User className="h-3.5 w-3.5 mr-2" />Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePhotoUpload(person.id)}>
                            <Camera className="h-3.5 w-3.5 mr-2" />Upload Photo
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => { setPersonToDelete(person); setDeletePersonAlertOpen(true) }} className="text-destructive focus:text-destructive">
                            <Trash2 className="h-3.5 w-3.5 mr-2" />Remove Person
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="divide-y divide-border/40">
                    <div className="grid items-center text-xs font-medium text-muted-foreground bg-muted/30" style={{ gridTemplateColumns: "1fr 100px 100px" }}>
                      <div className="px-3 py-1.5">Goal</div>
                      <div className="px-2 py-1.5 text-center border-l border-border/40">
                        <div className="font-semibold text-foreground">Last CTM</div>
                        <div className="text-[10px] text-muted-foreground truncate">{hasLastCtm ? lastCtm.name : "—"}</div>
                      </div>
                      <div className="px-2 py-1.5 text-center border-l border-border/40">
                        <div className="font-semibold text-foreground">This CTM</div>
                        <div className="text-[10px] text-muted-foreground truncate">{currentCtm?.name || "—"}</div>
                      </div>
                    </div>

                    {person.goals.map((goal, goalIndex) => (
                      <div key={goalIndex} className="grid items-center" style={{ gridTemplateColumns: "1fr 100px 100px" }}>
                        <div className="px-3 py-1.5 text-sm text-muted-foreground truncate">{goal}</div>
                        <div className="px-2 py-1 flex justify-center border-l border-border/40">
                          {hasLastCtm ? (
                            <StatusSelector
                              status={getStatus(person.id, goalIndex, lastCtm.id)}
                              onStatusChange={(status) => setStatus(person.id, goalIndex, lastCtm.id, status)}
                              compact
                            />
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-xs text-muted-foreground/50 cursor-default">—</span>
                              </TooltipTrigger>
                              <TooltipContent><p>No previous period</p></TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        <div className="px-2 py-1 flex justify-center border-l border-border/40">
                          <StatusSelector
                            status={getStatus(person.id, goalIndex, currentCtmId)}
                            onStatusChange={(status) => setStatus(person.id, goalIndex, currentCtmId, status)}
                            compact
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {people.length === 0 && (
            <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground text-sm">
              No team members yet. Click &quot;Add Person&quot; to get started.
            </div>
          )}
        </div>

        <AddPersonDialog open={addPersonDialogOpen} onOpenChange={setAddPersonDialogOpen} onAdd={handleAddPerson} />
        <EditGoalsDialog open={editGoalsDialogOpen} onOpenChange={setEditGoalsDialogOpen} person={editingPerson} onSave={handleEditGoals} />
        <RenamePersonDialog open={renamePersonDialogOpen} onOpenChange={setRenamePersonDialogOpen} person={editingPerson} onSave={handleRenamePerson} />
        <AddCtmPeriodDialog open={addCtmDialogOpen} onOpenChange={setAddCtmDialogOpen} onAdd={handleAddCtmPeriod} />
        <RenameCtmPeriodDialog open={renameCtmDialogOpen} onOpenChange={setRenameCtmDialogOpen} period={editingCtmPeriod} onSave={handleRenameCtmPeriod} />

        <AlertDialog open={deletePersonAlertOpen} onOpenChange={setDeletePersonAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove {personToDelete?.name}?</AlertDialogTitle>
              <AlertDialogDescription>This will permanently remove {personToDelete?.name} and all their status history.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeletePerson} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={deleteCtmAlertOpen} onOpenChange={setDeleteCtmAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {currentCtm?.name}?</AlertDialogTitle>
              <AlertDialogDescription>This will permanently delete &quot;{currentCtm?.name}&quot; and all status entries for this period.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteCtmPeriod} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}
