"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { FieldConfig, ModuleConfig } from "@/presentation/config/modules"
import type { ReferenceOption } from "@/presentation/queries"
import { createRecord, updateRecord } from "@/presentation/actions/crud-actions"

interface RecordFormProps {
  config: ModuleConfig
  referenceOptions: Record<string, ReferenceOption[]>
  trigger: React.ReactNode
  record?: Record<string, unknown>
}

function initialValue(field: FieldConfig, record?: Record<string, unknown>) {
  const raw = record?.[field.name]
  if (raw === undefined || raw === null) {
    if (field.type === "json") return "[]"
    if (field.type === "select" && field.name === "esSemillero") return "false"
    if (field.type === "select" && field.options?.length)
      return field.options[0].value
    return ""
  }
  if (field.type === "json") return JSON.stringify(raw, null, 2)
  if (typeof raw === "boolean") return String(raw)
  return String(raw)
}

export function RecordForm({
  config,
  referenceOptions,
  trigger,
  record,
}: RecordFormProps) {
  const editing = Boolean(record)
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      config.fields.map((f) => [f.name, initialValue(f, record)]),
    ),
  )
  const [pending, startTransition] = useTransition()

  function setField(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  function submit() {
    startTransition(async () => {
      const result = editing
        ? await updateRecord(config.slug, String(record!.id), values)
        : await createRecord(config.slug, values)
      if (result.ok) {
        toast.success(
          editing ? "Registro actualizado" : `${config.singular} creado`,
        )
        setOpen(false)
      } else {
        toast.error(result.error ?? "No se pudo guardar")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? `Editar ${config.singular}` : `Nuevo ${config.singular}`}
          </DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {config.fields.map((field) => (
            <div key={field.name} className="flex flex-col gap-1.5">
              <Label htmlFor={field.name}>
                {field.label}
                {field.required && (
                  <span className="text-destructive"> *</span>
                )}
              </Label>
              {renderInput(field, values[field.name], setField, referenceOptions)}
              {field.helper && (
                <p className="text-xs text-muted-foreground">{field.helper}</p>
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function renderInput(
  field: FieldConfig,
  value: string,
  setField: (name: string, value: string) => void,
  referenceOptions: Record<string, ReferenceOption[]>,
) {
  switch (field.type) {
    case "textarea":
    case "json":
      return (
        <Textarea
          id={field.name}
          value={value}
          rows={field.type === "json" ? 5 : 3}
          className={field.type === "json" ? "font-mono text-xs" : undefined}
          onChange={(e) => setField(field.name, e.target.value)}
        />
      )
    case "number":
      return (
        <Input
          id={field.name}
          type="number"
          value={value}
          onChange={(e) => setField(field.name, e.target.value)}
        />
      )
    case "date":
      return (
        <DatePicker
          id={field.name}
          value={value}
          onChange={(v) => setField(field.name, v)}
        />
      )
    case "select":
      return (
        <Select
          value={value}
          onValueChange={(v) => setField(field.name, v ?? "")}
          items={Object.fromEntries(
            (field.options ?? []).map((o) => [o.value, o.label]),
          )}
        >
          <SelectTrigger id={field.name}>
            <SelectValue placeholder="Selecciona…" />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    case "reference": {
      const opts = referenceOptions[field.name] ?? []
      return (
        <Select
          value={value}
          onValueChange={(v) => setField(field.name, v ?? "")}
          items={Object.fromEntries(opts.map((o) => [o.value, o.label]))}
        >
          <SelectTrigger id={field.name}>
            <SelectValue placeholder="Selecciona…" />
          </SelectTrigger>
          <SelectContent>
            {opts.length === 0 && (
              <SelectItem value="__none" disabled>
                Sin registros
              </SelectItem>
            )}
            {opts.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }
    default:
      return (
        <Input
          id={field.name}
          value={value}
          onChange={(e) => setField(field.name, e.target.value)}
        />
      )
  }
}
