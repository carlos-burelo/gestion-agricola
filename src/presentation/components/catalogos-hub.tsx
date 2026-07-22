"use client"

import {
  BookOpen,
  Boxes,
  Layers,
  Plus,
  Search,
  Star,
} from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { RecordForm } from "@/presentation/components/record-form"
import { RecordTable } from "@/presentation/components/record-table"
import { getModuleTheme } from "@/presentation/config/module-theme"
import { MODULE_GROUPS, type ModuleConfig } from "@/presentation/config/modules"
import type { ReferenceOption } from "@/presentation/queries"

export interface CatalogModuleData {
  slug: string
  config: ModuleConfig
  records: Record<string, unknown>[]
  referenceOptions: Record<string, ReferenceOption[]>
  labelMap: Record<string, string>
}

interface CatalogosHubProps {
  modulesData: CatalogModuleData[]
  initialSlug?: string
  cuentasPorUsuarioMap?: Record<string, string[]>
  cuentasList?: Record<string, unknown>[]
}

export function CatalogosHub({
  modulesData,
  initialSlug,
}: CatalogosHubProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Determine active slug based on initialSlug, URL path, or query param
  const defaultSlug = useMemo(() => {
    const queryTab = searchParams.get("tab")
    if (queryTab && modulesData.some((m) => m.slug === queryTab)) {
      return queryTab
    }
    if (
      initialSlug &&
      initialSlug !== "catalogos" &&
      modulesData.some((m) => m.slug === initialSlug)
    ) {
      return initialSlug
    }
    return modulesData.find((m) => m.slug === "bancos")?.slug ?? modulesData[0]?.slug ?? "bancos"
  }, [initialSlug, modulesData, searchParams])

  const [activeSlug, setActiveSlug] = useState<string>(defaultSlug)
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Keep activeSlug synced if defaultSlug changes
  useEffect(() => {
    setActiveSlug(defaultSlug)
  }, [defaultSlug])

  // Active module data
  const activeModule = useMemo(() => {
    return (
      modulesData.find((m) => m.slug === activeSlug) ?? modulesData[0]
    )
  }, [activeSlug, modulesData])

  // Filter modules based on search query in the left sidebar
  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return modulesData
    const q = searchQuery.toLowerCase()
    return modulesData.filter(
      (m) =>
        m.config.title.toLowerCase().includes(q) ||
        m.config.description.toLowerCase().includes(q) ||
        m.config.group.toLowerCase().includes(q)
    )
  }, [modulesData, searchQuery])

  // Total records across all catalogs
  const totalRecords = useMemo(() => {
    return modulesData.reduce((acc, curr) => acc + curr.records.length, 0)
  }, [modulesData])

  const handleTabChange = (slug: string) => {
    setActiveSlug(slug)
    if (pathname.includes("/dashboard/catalogos")) {
      router.replace(`/dashboard/catalogos?tab=${slug}`, { scroll: false })
    } else {
      router.replace(`/dashboard/${slug}`, { scroll: false })
    }
  }

  const activeTheme = getModuleTheme(activeModule.config)
  const ActiveIcon = activeTheme.Icon

  return (
    <div className="flex flex-col gap-6">
      {/* Sleek Page Header */}
      <div className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs">
            <BookOpen className="size-6" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Catálogos del Sistema
              </h1>
            </div>
            <p className="text-xs text-muted-foreground">
              Gestión centralizada de tablas maestras e información del sistema con operaciones CRUD, filtros y modales.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 py-1 px-3 text-xs font-normal">
            <Boxes className="size-3.5 text-primary" />
            <span className="font-semibold">{modulesData.length}</span> Catálogos
          </Badge>
          <Badge variant="secondary" className="gap-1.5 py-1 px-3 text-xs font-normal">
            <span className="font-semibold">{totalRecords.toLocaleString("es-MX")}</span> Registros
          </Badge>
        </div>
      </div>

      {/* Mobile Selector Dropdown (visible on small screens) */}
      <div className="block lg:hidden">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Layers className="size-3.5 text-primary" />
            Seleccionar catálogo activo:
          </label>
          <Select value={activeSlug} onValueChange={handleTabChange}>
            <SelectTrigger className="w-full h-10 bg-card">
              <SelectValue placeholder="Selecciona un catálogo" />
            </SelectTrigger>
            <SelectContent>
              {MODULE_GROUPS.map((group) => {
                const items = modulesData.filter((m) => m.config.group === group)
                if (items.length === 0) return null
                return (
                  <SelectGroup key={group}>
                    <SelectLabel className="font-bold text-primary">{group}</SelectLabel>
                    {items.map(({ slug, config, records }) => {
                      const { Icon } = getModuleTheme(config)
                      return (
                        <SelectItem key={slug} value={slug}>
                          <span className="flex items-center gap-2">
                            <Icon className="size-4 text-muted-foreground" />
                            <span className="font-medium">{config.title}</span>
                            <span className="text-xs text-muted-foreground font-normal">
                              ({records.length})
                            </span>
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectGroup>
                )
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Master-Detail Layout for Desktop */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 items-start">
        {/* Left Master Panel: Catalog List Navigation */}
        <div className="hidden lg:flex lg:col-span-1 flex-col gap-3 rounded-xl border border-border bg-card p-3.5 shadow-xs sticky top-20">
          {/* Quick Search */}
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar catálogo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs bg-muted/30"
            />
          </div>

          {/* Grouped Catalog List */}
          <div className="flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
            {MODULE_GROUPS.map((group) => {
              const groupItems = filteredModules.filter(
                (m) => m.config.group === group
              )
              if (groupItems.length === 0) return null
              const isMainGroup = group.includes("Principales")
              return (
                <div key={group} className="flex flex-col gap-1">
                  <span
                    className={cn(
                      "px-2 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1",
                      isMainGroup
                        ? "text-primary"
                        : "text-muted-foreground/80"
                    )}
                  >
                    {isMainGroup && <Star className="size-3 fill-primary text-primary shrink-0" />}
                    {group}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    {groupItems.map(({ slug, config, records }) => {
                      const { Icon } = getModuleTheme(config)
                      const isActive = activeSlug === slug
                      return (
                        <button
                          key={slug}
                          type="button"
                          onClick={() => handleTabChange(slug)}
                          className={cn(
                            "flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-all text-left group",
                            isActive
                              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <Icon
                              className={cn(
                                "size-3.5 shrink-0 transition-colors",
                                isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                              )}
                            />
                            <span className="truncate">{config.title}</span>
                          </div>
                          <span
                            className={cn(
                              "rounded-full px-1.5 py-0.2 text-[10px] tabular-nums font-normal",
                              isActive
                                ? "bg-background/20 text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {records.length}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Detail Panel: Active Catalog View */}
        <div className="lg:col-span-3 flex flex-col gap-5">
          {activeModule && (
              <RecordTable
                config={activeModule.config}
                records={activeModule.records}
                referenceOptions={activeModule.referenceOptions}
                labelMap={activeModule.labelMap}
              />
          )}
        </div>
      </div>
    </div>
  )
}
