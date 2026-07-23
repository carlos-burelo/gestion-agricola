"use client"

import { useEffect, useState, useTransition } from "react"
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

function initialValue(
  field: FieldConfig,
  record?: Record<string, unknown>,
  referenceOptions?: Record<string, ReferenceOption[]>,
) {
  const raw = record?.[field.name]
  if (raw !== undefined && raw !== null) {
    if (field.type === "json") return JSON.stringify(raw, null, 2)
    if (typeof raw === "boolean") return String(raw)
    return String(raw)
  }

  if (field.type === "json") return "[]"
  if (field.type === "select" && field.name === "esSemillero") return "false"
  if (field.type === "select" && field.options?.length) {
    return field.options[0].value
  }
  if (field.type === "reference" && referenceOptions?.[field.name]?.length) {
    return referenceOptions[field.name][0].value
  }
  return ""
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
      config.fields.map((f) => [f.name, initialValue(f, record, referenceOptions)]),
    ),
  )
  const [pending, startTransition] = useTransition()

  // Ensure reference fields auto-select the first available option if open and field has options
  useEffect(() => {
    if (open) {
      setValues((prev) => {
        const next = { ...prev }
        let changed = false
        for (const f of config.fields) {
          const currentVal = record?.[f.name] !== undefined ? String(record[f.name]) : next[f.name]
          if (f.type === "reference" && !currentVal) {
            const opts = referenceOptions[f.name] ?? []
            if (opts.length > 0) {
              next[f.name] = opts[0].value
              changed = true
            }
          }
          if (f.type === "select" && !currentVal && f.options?.length) {
            next[f.name] = f.options[0].value
            changed = true
          }
        }
        return changed ? next : prev
      })
    }
  }, [open, config.fields, referenceOptions, record])

  function setField(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  function submit() {
    // Client-side validation for required fields
    for (const field of config.fields) {
      const val = values[field.name]
      if (field.required) {
        if (!val || val.trim() === "" || val === "__none") {
          toast.error(`El campo "${field.label}" es obligatorio.`)
          return
        }
      }
      if (field.type === "reference" && field.required) {
        const opts = referenceOptions[field.name] ?? []
        if (opts.length === 0) {
          toast.error(`Debes registrar primero un ${field.label} en su respectivo catálogo.`)
          return
        }
      }
    }

    startTransition(async () => {
      const result = editing
        ? await updateRecord(config.slug, String(record!.id), values)
        : await createRecord(config.slug, values)
      if (result.ok) {
        toast.success(
          editing ? "Registro actualizado correctamente" : `${config.singular} registrado correctamente`,
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
                  <span className="text-destructive font-bold"> *</span>
                )}
              </Label>
              {renderInput(field, values[field.name] ?? "", setField, referenceOptions)}
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
          name={field.name}
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
          name={field.name}
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
          <SelectTrigger id={field.name} name={field.name}>
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
        <div className="flex flex-col gap-1">
          <Select
            value={value}
            onValueChange={(v) => setField(field.name, v ?? "")}
            items={Object.fromEntries(opts.map((o) => [o.value, o.label]))}
          >
            <SelectTrigger id={field.name} name={field.name}>
              <SelectValue placeholder="Selecciona…" />
            </SelectTrigger>
            <SelectContent>
              {opts.length === 0 && (
                <SelectItem value="__none" disabled>
                  Sin registros disponibles
                </SelectItem>
              )}
              {opts.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {opts.length === 0 && (
            <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
              ⚠️ No existen {field.label}s registrados. Crea uno primero en su catálogo correspondiente.
            </p>
          )}
        </div>
      )
    }
    default:
      return (
        <Input
          id={field.name}
          name={field.name}
          value={value}
          onChange={(e) => setField(field.name, e.target.value)}
        />
      )
  }
}
