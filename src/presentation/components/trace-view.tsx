"use client"

import { useState, useTransition } from "react"
import { Check, X } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { TraceStep } from "@/core/application/traceability-service"
import { formatDate } from "@/lib/dates"
import { trazarAction } from "@/presentation/actions/operations-actions"

interface ReqOption {
  value: string
  label: string
}

export function TraceView({ requerimientos }: { requerimientos: ReqOption[] }) {
  const [reqId, setReqId] = useState("")
  const [steps, setSteps] = useState<TraceStep[]>([])
  const [pending, startTransition] = useTransition()

  const onSelect = (id: string | null) => {
    if (!id) return
    setReqId(id)
    startTransition(async () => {
      const res = await trazarAction(id)
      setSteps((res.data as TraceStep[]) ?? [])
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar requerimiento</CardTitle>
          <CardDescription>
            Reconstruye la cadena: solicitud → cotización → orden → recepción →
            cuenta por pagar → salida a campo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid max-w-sm gap-2">
            <Label>Requerimiento</Label>
            <Select
              value={reqId}
              onValueChange={onSelect}
              items={Object.fromEntries(
                requerimientos.map((r) => [r.value, r.label]),
              )}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar requerimiento" />
              </SelectTrigger>
              <SelectContent>
                {requerimientos.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {pending ? (
        <p className="text-sm text-muted-foreground">Cargando trazabilidad...</p>
      ) : null}

      {steps.length > 0 ? (
        <ol className="relative flex flex-col gap-4 border-l-2 border-border pl-6">
          {steps.map((step, i) => (
            <li key={`${step.etapa}-${i}`} className="relative">
              <span
                className={`absolute -left-[1.95rem] flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-background ${
                  step.encontrado
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
                aria-hidden="true"
              >
                {step.encontrado ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </span>
              <Card className="transition-colors hover:border-primary">
                <CardContent className="flex flex-col gap-1 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{step.etapa}</h3>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(step.fecha, "long")}
                    </span>
                  </div>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Referencia: </span>
                    {step.referencia}
                  </p>
                  <p className="text-sm text-muted-foreground">{step.detalle}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  )
}
