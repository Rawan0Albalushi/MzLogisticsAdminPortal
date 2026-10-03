import { useTranslation } from 'react-i18next'

export const PAYMENT_DUE_DAYS_MAX = 730

export type BillingUnit = 'job' | 'trip'
export type DueMode = 'immediate' | 'date'

export function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const date = new Date(year, (month || 1) - 1, (day || 1) + days)
  const nextYear = date.getFullYear()
  const nextMonth = String(date.getMonth() + 1).padStart(2, '0')
  const nextDay = String(date.getDate()).padStart(2, '0')
  return `${nextYear}-${nextMonth}-${nextDay}`
}

export function daysBetween(from: string, to: string): number {
  const [fromYear, fromMonth, fromDay] = from.split('-').map(Number)
  const [toYear, toMonth, toDay] = to.split('-').map(Number)
  const start = Date.UTC(fromYear, (fromMonth || 1) - 1, fromDay || 1)
  const end = Date.UTC(toYear, (toMonth || 1) - 1, toDay || 1)
  return Math.round((end - start) / 86_400_000)
}

function Segment<T extends string>({
  name,
  labelId,
  value,
  options,
  onChange,
}: {
  name: string
  labelId: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div className="mz-segment" role="radiogroup" aria-labelledby={labelId}>
      {options.map((option) => (
        <label key={option.value} className={value === option.value ? 'is-active' : undefined}>
          <input
            type="radio"
            name={name}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          {option.label}
        </label>
      ))}
    </div>
  )
}

export function PaymentTermsFields({
  billingUnit,
  dueMode,
  dueDate,
  requiredDate,
  dueDateError,
  onBillingUnitChange,
  onDueModeChange,
  onDueDateChange,
}: {
  billingUnit: BillingUnit
  dueMode: DueMode
  dueDate: string
  requiredDate: string
  dueDateError: string
  onBillingUnitChange: (value: BillingUnit) => void
  onDueModeChange: (value: DueMode) => void
  onDueDateChange: (value: string) => void
}) {
  const { t } = useTranslation()
  const earliestDue = requiredDate ? addDays(requiredDate, 1) : undefined
  const latestDue = requiredDate ? addDays(requiredDate, PAYMENT_DUE_DAYS_MAX) : undefined

  return (
    <section className="mz-payment-terms" aria-labelledby="shipment-payment-title">
      <h2 id="shipment-payment-title" className="mz-payment-terms__title">
        {t('paymentContract.title')}
      </h2>
      <p className="mz-field__hint mz-payment-terms__hint">{t('paymentContract.wizardHint')}</p>
      <div className="mz-field">
        <p id="shipment-billing-unit" className="mz-payment-terms__label">
          {t('paymentContract.unit')}
        </p>
        <Segment
          name="billing-unit"
          labelId="shipment-billing-unit"
          value={billingUnit}
          onChange={onBillingUnitChange}
          options={[
            { value: 'job', label: t('paymentContract.unitJob') },
            { value: 'trip', label: t('paymentContract.unitTrip') },
          ]}
        />
        <span className="mz-field__hint">
          {billingUnit === 'trip' ? t('paymentContract.unitTripHint') : t('paymentContract.unitJobHint')}
        </span>
      </div>
      <div className="mz-field">
        <p id="shipment-due-mode" className="mz-payment-terms__label">
          {t('paymentContract.dueDays')}
        </p>
        <Segment
          name="due-mode"
          labelId="shipment-due-mode"
          value={dueMode}
          onChange={onDueModeChange}
          options={[
            { value: 'immediate', label: t('paymentContract.dueImmediate') },
            { value: 'date', label: t('paymentContract.dueOnDate') },
          ]}
        />
        {dueMode === 'date' ? (
          <>
            <label htmlFor="shipment-due-date">{t('paymentContract.pickDueDate')}</label>
            <input
              id="shipment-due-date"
              className="mz-input"
              type="date"
              min={earliestDue}
              max={latestDue}
              value={dueDate}
              onChange={(event) => onDueDateChange(event.target.value)}
              required
              aria-invalid={Boolean(dueDateError)}
              aria-describedby={dueDateError ? 'shipment-due-date-error' : undefined}
            />
            {dueDateError ? (
              <span id="shipment-due-date-error" className="mz-field__error">
                {dueDateError}
              </span>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  )
}
