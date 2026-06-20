export function generateId(collection: string): string {
  const rand = Math.random().toString(36).slice(2, 8)
  return `${collection}-${Date.now().toString(36)}-${rand}`
}
export function nowDate(): Date {
  return new Date()
}
