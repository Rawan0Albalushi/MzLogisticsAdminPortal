export function earliestTransportStart(requiredDate?: string | null): string {
  const today = localDateInput(new Date())
  const required = (requiredDate ?? '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(required)) return today
  return required > today ? required : today
}

function localDateInput(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}
