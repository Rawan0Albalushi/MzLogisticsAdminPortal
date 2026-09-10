import { useTranslation } from 'react-i18next'

const SUCCESS = new Set([
  'active',
  'completed',
  'accepted',
  'paid',
  'delivered',
  'published',
  'available',
])
const DANGER = new Set(['rejected', 'cancelled', 'failed', 'void', 'inactive', 'expired'])
const WARNING = new Set([
  'pending',
  'pending_dispatch',
  'processing',
  'submitted',
  'draft',
  'maintenance',
  'suspended',
  'unassigned',
])
const INFO = new Set(['in_progress', 'in_transit', 'assigned', 'loaded', 'arrived', 'arrived_at_pickup', 'issued'])

function tone(status: string): string {
  if (SUCCESS.has(status)) return 'success'
  if (DANGER.has(status)) return 'danger'
  if (WARNING.has(status)) return 'warning'
  if (INFO.has(status)) return 'info'
  return 'neutral'
}

export function StatusBadge({ status }: { status?: string | null }) {
  const { t } = useTranslation()
  if (!status) {
    return <span className="mz-badge mz-badge--neutral">{t('common.noValue')}</span>
  }
  return <span className={`mz-badge mz-badge--${tone(status)}`}>{t(`status.${status}`, { defaultValue: status })}</span>
}
