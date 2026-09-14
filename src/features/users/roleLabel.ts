import type { AccessRole } from '@/core/api/types.ts'

export function roleLabel(
  roleName: string,
  catalog: AccessRole[] | undefined,
  translate: (key: string, options?: { defaultValue?: string }) => string,
  fallbackLabel?: string,
): string {
  const match = catalog?.find((role) => role.name === roleName)
  if (match && !match.is_system) {
    return match.display_name
  }

  if (match) {
    return translate(`roles.${roleName}`, { defaultValue: match.display_name })
  }

  return fallbackLabel || translate(`roles.${roleName}`, { defaultValue: roleName })
}
