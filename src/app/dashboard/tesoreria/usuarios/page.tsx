import { redirect } from "next/navigation"

export default function UsuariosPageRedirect() {
  redirect("/dashboard/catalogos?tab=usuarios")
}
