"use client"

import { useState, useEffect } from "react"
import { useShop } from "../layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Clock, Loader2, Save } from "lucide-react"

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

interface DayHours {
  open: string
  close: string
  isOpen: boolean
}

export default function HoursPage() {
  const { site } = useShop()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hours, setHours] = useState<Record<string, DayHours>>({
    Monday: { open: "11:00", close: "23:00", isOpen: true },
    Tuesday: { open: "11:00", close: "23:00", isOpen: true },
    Wednesday: { open: "11:00", close: "23:00", isOpen: true },
    Thursday: { open: "11:00", close: "23:00", isOpen: true },
    Friday: { open: "11:00", close: "23:30", isOpen: true },
    Saturday: { open: "11:00", close: "23:30", isOpen: true },
    Sunday: { open: "12:00", close: "22:00", isOpen: true },
  })

  useEffect(() => {
    if (site?.id) {
      setIsLoading(false)
    }
  }, [site?.id])

  const handleSave = async () => {
    setIsSaving(true)
    setTimeout(() => setIsSaving(false), 1000)
  }

  const updateDay = (day: string, field: keyof DayHours, value: string | boolean) => {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Opening Hours</h1>
          <p className="text-slate-500">Set your restaurant operating hours</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-orange-500 hover:bg-orange-600">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
          <CardDescription>Set opening and closing times for each day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {DAYS.map((day) => (
              <div key={day} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50">
                <div className="w-28 font-medium text-slate-900">{day}</div>
                <Switch 
                  checked={hours[day].isOpen} 
                  onCheckedChange={(v) => updateDay(day, "isOpen", v)} 
                />
                {hours[day].isOpen ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={hours[day].open}
                        onChange={(e) => updateDay(day, "open", e.target.value)}
                        className="w-32"
                      />
                      <span className="text-slate-500">to</span>
                      <Input
                        type="time"
                        value={hours[day].close}
                        onChange={(e) => updateDay(day, "close", e.target.value)}
                        className="w-32"
                      />
                    </div>
                  </>
                ) : (
                  <span className="text-slate-500">Closed</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
