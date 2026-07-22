"use client"

import { es } from "date-fns/locale"
import { CalendarDays } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { formatDate } from "@/lib/dates"
import { cn } from "@/lib/utils"

/** `YYYY-MM-DD` string → local Date (no timezone shift). */
function strToDate(s: string): Date | undefined {
  if (!s) return undefined
  const [y, m, d] = s.split("-").map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}

/** Local Date → `YYYY-MM-DD` string. */
function dateToStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function DatePicker({
  id,
  name,
  value,
  onChange,
  placeholder = "Selecciona fecha",
}: {
  id?: string
  /** When set, a hidden input mirrors the value for native form submission. */
  name?: string
  value: string
  onChange?: (value: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const selected = strToDate(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn(
            "w-full justify-start font-normal",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarDays data-icon="inline-start" />
          {value ? formatDate(value, "long") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={es}
          selected={selected}
          defaultMonth={selected}
          autoFocus
          onSelect={(d) => {
            onChange?.(d ? dateToStr(d) : "")
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
