import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default function TraspasosPage() {
  redirect("/dashboard/bancos/transferencias")
}
