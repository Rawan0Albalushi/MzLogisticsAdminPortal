import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  createEquipment,
  createTruck,
  fetchEquipment,
  fetchTrucks,
  fetchTruckTypes,
  updateEquipment,
  updateTruck,
  type EquipmentInput,
  type TruckInput,
} from '@/core/api/services.ts'
import { getApiMessage } from '@/core/api/client.ts'
import { useAuth } from '@/core/auth/AuthContext.tsx'
import { PERMISSIONS } from '@/core/constants/permissions.ts'
import { TRUCK_LIST_STATUSES } from '@/core/constants/statuses.ts'
import type { Equipment, Truck } from '@/core/api/types.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { FilterBar, StatusFilter } from '@/shared/components/FilterBar.tsx'
import { SearchInput } from '@/shared/components/SearchInput.tsx'
import { DataTable, type Column } from '@/shared/components/DataTable.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog.tsx'
import { FormField } from '@/shared/components/FormField.tsx'
import { SectionTitle } from '@/shared/components/SectionTitle.tsx'
import { useListQuery } from '@/shared/hooks/useListQuery.ts'
import { displayValue, formatDate, organizationName } from '@/shared/utils/format.ts'
import { ExcelImportDialog } from '@/shared/components/ExcelImportDialog.tsx'
import type { SpreadsheetImportError } from '@/core/api/services.ts'
import { DownloadReportButton } from '@/shared/reports/DownloadReportButton.tsx'
import { createListReport, listReportFilters, reportStatus } from '@/shared/reports/buildReport.ts'
import { fetchAllPages } from '@/shared/reports/fetchAllPages.ts'

type Owner = 'platform' | 'provider'

const emptyTruck = {
  plate_number: '',
  type: '',
  capacity_tons: '',
  volume_cbm: '',
  year: '',
  make: '',
  model: '',
  status: 'available',
  insurance_expires_at: '',
}

const emptyEquipment = {
  name: '',
  type: '',
  quantity: '1',
  status: 'available',
  truck_id: '',
}

export function FleetPage() {
  const { t } = useTranslation()
  const { hasPermission } = useAuth()
  const list = useListQuery()
  const queryClient = useQueryClient()
  const canManage = hasPermission(PERMISSIONS.FLEET_MANAGE)
  const [owner, setOwner] = useState<Owner>('platform')
  const [equipmentPage, setEquipmentPage] = useState(1)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const [truckOpen, setTruckOpen] = useState(false)
  const [equipmentOpen, setEquipmentOpen] = useState(false)
  const [editingTruck, setEditingTruck] = useState<Truck | null>(null)
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null)
  const [truckForm, setTruckForm] = useState(emptyTruck)
  const [equipmentForm, setEquipmentForm] = useState(emptyEquipment)
  const [importTarget, setImportTarget] = useState<'trucks' | 'equipment' | null>(null)

  const trucks = useQuery({
    queryKey: ['trucks', owner, list.search, list.status, list.page],
    queryFn: () => fetchTrucks({ search: list.search, status: list.status, page: list.page, owner }),
  })
  const equipment = useQuery({
    queryKey: ['equipment', list.search, equipmentPage],
    queryFn: () => fetchEquipment({ search: list.search, page: equipmentPage, owner: 'platform' }),
    enabled: owner === 'platform',
  })
  const truckTypes = useQuery({
    queryKey: ['truck-types'],
    queryFn: fetchTruckTypes,
    enabled: owner === 'platform',
  })
  const platformTrucks = useQuery({
    queryKey: ['trucks', 'platform-options'],
    queryFn: () => fetchTrucks({ owner: 'platform', per_page: 100 }),
    enabled: owner === 'platform' && equipmentOpen,
  })

  const saveTruck = useMutation({
    mutationFn: (payload: TruckInput) =>
      editingTruck ? updateTruck(editingTruck.id, payload) : createTruck(payload),
    onSuccess: async () => {
      setTruckOpen(false)
      setError('')
      setFeedback(t('fleet.truckSaved'))
      await queryClient.invalidateQueries({ queryKey: ['trucks'] })
    },
    onError: (err) => setError(getApiMessage(err, t('fleet.saveFailed'))),
  })
  const saveEquipment = useMutation({
    mutationFn: (payload: EquipmentInput) =>
      editingEquipment ? updateEquipment(editingEquipment.id, payload) : createEquipment(payload),
    onSuccess: async () => {
      setEquipmentOpen(false)
      setError('')
      setFeedback(t('fleet.equipmentSaved'))
      await queryClient.invalidateQueries({ queryKey: ['equipment'] })
    },
    onError: (err) => setError(getApiMessage(err, t('fleet.saveFailed'))),
  })

  function switchOwner(next: Owner) {
    setOwner(next)
    setFeedback('')
    list.setPage(1)
    setEquipmentPage(1)
  }

  function openTruck(row?: Truck) {
    setEditingTruck(row ?? null)
    setError('')
    setTruckForm(
      row
        ? {
            plate_number: row.plate_number,
            type: row.type ?? '',
            capacity_tons: row.capacity_tons == null ? '' : String(row.capacity_tons),
            volume_cbm: row.volume_cbm == null ? '' : String(row.volume_cbm),
            year: row.year == null ? '' : String(row.year),
            make: row.make ?? '',
            model: row.model ?? '',
            status: row.status,
            insurance_expires_at: row.insurance_expires_at?.slice(0, 10) ?? '',
          }
        : emptyTruck,
    )
    setTruckOpen(true)
  }

  function openEquipment(row?: Equipment) {
    setEditingEquipment(row ?? null)
    setError('')
    setEquipmentForm(
      row
        ? {
            name: row.name,
            type: row.type ?? '',
            quantity: String(row.quantity),
            status: row.status,
            truck_id: row.truck_id == null ? '' : String(row.truck_id),
          }
        : emptyEquipment,
    )
    setEquipmentOpen(true)
  }

  function submitTruck(event: FormEvent) {
    event.preventDefault()
    const payload: TruckInput = {
      plate_number: truckForm.plate_number.trim(),
      type: truckForm.type,
      capacity_tons: Number(truckForm.capacity_tons),
      status: truckForm.status,
    }
    if (truckForm.volume_cbm.trim()) payload.volume_cbm = Number(truckForm.volume_cbm)
    if (truckForm.year.trim()) payload.year = Number(truckForm.year)
    if (truckForm.make.trim()) payload.make = truckForm.make.trim()
    if (truckForm.model.trim()) payload.model = truckForm.model.trim()
    if (truckForm.insurance_expires_at) payload.insurance_expires_at = truckForm.insurance_expires_at
    saveTruck.mutate(payload)
  }

  function submitEquipment(event: FormEvent) {
    event.preventDefault()
    saveEquipment.mutate({
      name: equipmentForm.name.trim(),
      type: equipmentForm.type.trim() || undefined,
      quantity: Number(equipmentForm.quantity),
      status: equipmentForm.status,
      truck_id: equipmentForm.truck_id ? Number(equipmentForm.truck_id) : null,
    })
  }

  const truckColumns: Column<Truck>[] = [
    { id: 'plate', header: t('fleet.plate'), cell: (row) => row.plate_number },
    { id: 'type', header: t('common.type'), cell: (row) => displayValue(row.type_label ?? row.type) },
    { id: 'capacity', header: t('fleet.capacity'), cell: (row) => displayValue(row.capacity_tons) },
    { id: 'volume', header: t('fleet.volume'), cell: (row) => displayValue(row.volume_cbm) },
    { id: 'make', header: t('fleet.make'), cell: (row) => `${displayValue(row.make)} ${displayValue(row.model)}` },
    ...(owner === 'provider'
      ? [{ id: 'org', header: t('common.provider'), cell: (row: Truck) => organizationName(row.organization) }]
      : []),
    { id: 'driver', header: t('fleet.assignedDriver'), cell: (row) => displayValue(row.assigned_driver?.name) },
    { id: 'insurance', header: t('fleet.insurance'), cell: (row) => formatDate(row.insurance_expires_at) },
    { id: 'status', header: t('common.status'), cell: (row) => <StatusBadge status={row.status} /> },
    ...(owner === 'platform' && canManage
      ? [
          {
            id: 'actions',
            header: t('common.actions'),
            cell: (row: Truck) => (
              <button type="button" className="mz-btn mz-btn--ghost" onClick={() => openTruck(row)}>
                {t('common.edit')}
              </button>
            ),
          },
        ]
      : []),
  ]

  const equipmentColumns: Column<Equipment>[] = [
    { id: 'name', header: t('common.name'), cell: (row) => row.name },
    { id: 'type', header: t('common.type'), cell: (row) => displayValue(row.type) },
    { id: 'quantity', header: t('common.quantity'), cell: (row) => row.quantity },
    { id: 'truck', header: t('fleet.plate'), cell: (row) => displayValue(row.truck?.plate_number) },
    { id: 'status', header: t('common.status'), cell: (row) => <StatusBadge status={row.status} /> },
    ...(canManage
      ? [
          {
            id: 'actions',
            header: t('common.actions'),
            cell: (row: Equipment) => (
              <button type="button" className="mz-btn mz-btn--ghost" onClick={() => openEquipment(row)}>
                {t('common.edit')}
              </button>
            ),
          },
        ]
      : []),
  ]

  const activeTypes = (truckTypes.data ?? []).filter((row) => row.is_active)
  const subtitle = owner === 'platform' ? t('fleet.platformSubtitle') : t('fleet.providerSubtitle')

  return (
    <>
      <PageHeader
        title={t('fleet.title')}
        subtitle={subtitle}
        actions={
          <>
            {owner === 'platform' && canManage ? (
              <>
                <button type="button" className="mz-btn mz-btn--primary" onClick={() => openTruck()}>
                  {t('fleet.addTruck')}
                </button>
                <button type="button" className="mz-btn mz-btn--ghost" onClick={() => setImportTarget('trucks')}>
                  {t('fleet.importTrucks')}
                </button>
              </>
            ) : null}
            <DownloadReportButton
              build={async () => {
                const items = await fetchAllPages((page, perPage) =>
                  fetchTrucks({ search: list.search, status: list.status, page, per_page: perPage, owner }),
                )
                return createListReport({
                  title: t('fleet.title'),
                  subtitle,
                  filters: listReportFilters(t, list),
                  columns: [
                    t('fleet.plate'),
                    t('common.type'),
                    t('fleet.capacity'),
                    t('fleet.volume'),
                    t('fleet.make'),
                    t('common.provider'),
                    t('fleet.assignedDriver'),
                    t('fleet.insurance'),
                    t('common.status'),
                  ],
                  rows: items.map((row) => [
                    row.plate_number,
                    displayValue(row.type_label ?? row.type),
                    displayValue(row.capacity_tons),
                    displayValue(row.volume_cbm),
                    `${displayValue(row.make)} ${displayValue(row.model)}`,
                    organizationName(row.organization),
                    displayValue(row.assigned_driver?.name),
                    formatDate(row.insurance_expires_at),
                    reportStatus(t, row.status),
                  ]),
                })
              }}
            />
          </>
        }
      />
      <div className="mz-owner-switch">
      <div className="mz-segment" role="radiogroup" aria-label={t('fleet.title')}>
        <label className={owner === 'platform' ? 'is-active' : undefined}>
          <input type="radio" name="fleet-owner" checked={owner === 'platform'} onChange={() => switchOwner('platform')} />
          {t('fleet.platformTab')}
        </label>
        <label className={owner === 'provider' ? 'is-active' : undefined}>
          <input type="radio" name="fleet-owner" checked={owner === 'provider'} onChange={() => switchOwner('provider')} />
          {t('fleet.providerTab')}
        </label>
      </div>
      </div>
      {feedback ? <div className="mz-alert mz-alert--ok">{feedback}</div> : null}
      <FilterBar>
        <SearchInput value={list.search} onChange={(value) => list.setFilter('search', value)} />
        <StatusFilter
          value={list.status}
          options={[...TRUCK_LIST_STATUSES]}
          onChange={(value) => list.setFilter('status', value)}
          allLabel={t('common.allStatuses')}
          label={(status) => t(`status.${status}`)}
        />
      </FilterBar>
      <DataTable
        columns={truckColumns}
        rows={trucks.data?.items ?? []}
        rowKey={(row) => row.id}
        isLoading={trucks.isLoading}
        isError={trucks.isError}
        onRetry={() => void trucks.refetch()}
        meta={trucks.data?.meta}
        onPageChange={list.setPage}
      />

      {owner === 'platform' ? (
        <section className="mz-section">
          <SectionTitle
            icon="fleet"
            title={t('fleet.equipment')}
            extra={
              canManage ? (
                <>
                  <button type="button" className="mz-btn mz-btn--primary" onClick={() => openEquipment()}>
                    {t('fleet.addEquipment')}
                  </button>
                  <button type="button" className="mz-btn mz-btn--ghost" onClick={() => setImportTarget('equipment')}>
                    {t('fleet.importEquipment')}
                  </button>
                </>
              ) : null
            }
          />
          <p className="mz-offer__hint">{t('fleet.equipmentHint')}</p>
          <DataTable
            columns={equipmentColumns}
            rows={equipment.data?.items ?? []}
            rowKey={(row) => row.id}
            isLoading={equipment.isLoading}
            isError={equipment.isError}
            onRetry={() => void equipment.refetch()}
            meta={equipment.data?.meta}
            onPageChange={setEquipmentPage}
          />
        </section>
      ) : null}

      <ConfirmDialog
        open={truckOpen}
        wide
        title={editingTruck ? t('fleet.editTruck') : t('fleet.addTruck')}
        confirmLabel={saveTruck.isPending ? t('common.saving') : t('common.save')}
        busy={saveTruck.isPending}
        onConfirm={() => {
          const formEl = document.getElementById('truck-form') as HTMLFormElement | null
          formEl?.requestSubmit()
        }}
        onClose={() => setTruckOpen(false)}
      >
        <form id="truck-form" className="mz-form" onSubmit={submitTruck}>
          {error ? <div className="mz-alert">{error}</div> : null}
          <FormField label={t('fleet.plate')} htmlFor="truck-plate" required>
            <input id="truck-plate" className="mz-input" value={truckForm.plate_number} required maxLength={32} onChange={(event) => setTruckForm((current) => ({ ...current, plate_number: event.target.value }))} />
          </FormField>
          <FormField label={t('common.type')} htmlFor="truck-type" required>
            <select id="truck-type" className="mz-select" value={truckForm.type} required onChange={(event) => setTruckForm((current) => ({ ...current, type: event.target.value }))}>
              <option value="">{t('shipments.chooseTruckType')}</option>
              {activeTypes.map((row) => (
                <option key={row.id} value={row.code}>
                  {row.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label={t('fleet.capacity')} htmlFor="truck-capacity" required>
            <input id="truck-capacity" className="mz-input" inputMode="decimal" value={truckForm.capacity_tons} required onChange={(event) => setTruckForm((current) => ({ ...current, capacity_tons: event.target.value }))} />
          </FormField>
          <FormField label={t('fleet.volume')} htmlFor="truck-volume">
            <input id="truck-volume" className="mz-input" inputMode="decimal" value={truckForm.volume_cbm} onChange={(event) => setTruckForm((current) => ({ ...current, volume_cbm: event.target.value }))} />
          </FormField>
          <FormField label={t('fleet.make')} htmlFor="truck-make">
            <input id="truck-make" className="mz-input" value={truckForm.make} maxLength={80} onChange={(event) => setTruckForm((current) => ({ ...current, make: event.target.value }))} />
          </FormField>
          <FormField label={t('fleet.model')} htmlFor="truck-model">
            <input id="truck-model" className="mz-input" value={truckForm.model} maxLength={80} onChange={(event) => setTruckForm((current) => ({ ...current, model: event.target.value }))} />
          </FormField>
          <FormField label={t('fleet.year')} htmlFor="truck-year">
            <input id="truck-year" className="mz-input" inputMode="numeric" value={truckForm.year} onChange={(event) => setTruckForm((current) => ({ ...current, year: event.target.value }))} />
          </FormField>
          <FormField label={t('fleet.insurance')} htmlFor="truck-insurance">
            <input id="truck-insurance" className="mz-input" type="date" value={truckForm.insurance_expires_at} onChange={(event) => setTruckForm((current) => ({ ...current, insurance_expires_at: event.target.value }))} />
          </FormField>
          <FormField label={t('common.status')} htmlFor="truck-status">
            <select id="truck-status" className="mz-select" value={truckForm.status} onChange={(event) => setTruckForm((current) => ({ ...current, status: event.target.value }))}>
              {TRUCK_LIST_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(`status.${status}`)}
                </option>
              ))}
            </select>
          </FormField>
        </form>
      </ConfirmDialog>

      <ConfirmDialog
        open={equipmentOpen}
        title={editingEquipment ? t('fleet.editEquipment') : t('fleet.addEquipment')}
        confirmLabel={saveEquipment.isPending ? t('common.saving') : t('common.save')}
        busy={saveEquipment.isPending}
        onConfirm={() => {
          const formEl = document.getElementById('equipment-form') as HTMLFormElement | null
          formEl?.requestSubmit()
        }}
        onClose={() => setEquipmentOpen(false)}
      >
        <form id="equipment-form" className="mz-form" onSubmit={submitEquipment}>
          {error ? <div className="mz-alert">{error}</div> : null}
          <FormField label={t('common.name')} htmlFor="equipment-name" required>
            <input id="equipment-name" className="mz-input" value={equipmentForm.name} required maxLength={120} onChange={(event) => setEquipmentForm((current) => ({ ...current, name: event.target.value }))} />
          </FormField>
          <FormField label={t('common.type')} htmlFor="equipment-type">
            <input id="equipment-type" className="mz-input" value={equipmentForm.type} maxLength={80} onChange={(event) => setEquipmentForm((current) => ({ ...current, type: event.target.value }))} />
          </FormField>
          <FormField label={t('common.quantity')} htmlFor="equipment-quantity" required>
            <input id="equipment-quantity" className="mz-input" inputMode="numeric" value={equipmentForm.quantity} required onChange={(event) => setEquipmentForm((current) => ({ ...current, quantity: event.target.value }))} />
          </FormField>
          <FormField label={t('fleet.plate')} htmlFor="equipment-truck">
            <select id="equipment-truck" className="mz-select" value={equipmentForm.truck_id} onChange={(event) => setEquipmentForm((current) => ({ ...current, truck_id: event.target.value }))}>
              <option value="">{t('fleet.noTruck')}</option>
              {(platformTrucks.data?.items ?? []).map((row) => (
                <option key={row.id} value={row.id}>
                  {row.plate_number}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label={t('common.status')} htmlFor="equipment-status">
            <select id="equipment-status" className="mz-select" value={equipmentForm.status} onChange={(event) => setEquipmentForm((current) => ({ ...current, status: event.target.value }))}>
              {['available', 'in_use', 'maintenance', 'inactive'].map((status) => (
                <option key={status} value={status}>
                  {t(`status.${status}`)}
                </option>
              ))}
            </select>
          </FormField>
        </form>
      </ConfirmDialog>

      <ExcelImportDialog
        open={importTarget !== null}
        title={importTarget === 'equipment' ? t('fleet.importEquipmentTitle') : t('fleet.importTrucksTitle')}
        hint={importTarget === 'equipment' ? t('fleet.importEquipmentHint') : t('fleet.importTrucksHint')}
        templatePath={importTarget === 'equipment' ? '/equipment/import-template' : '/trucks/import-template'}
        templateFilename={importTarget === 'equipment' ? 'equipment-import-template.xlsx' : 'trucks-import-template.xlsx'}
        importPath={importTarget === 'equipment' ? '/equipment/import' : '/trucks/import'}
        detailKeys={importTarget === 'equipment' ? ['name', 'truck_plate'] : ['plate_number', 'type']}
        localizeError={(rowError) => localizeFleetImportError(t, importTarget, rowError)}
        onImported={async (imported) => {
          if (imported.created > 0) {
            setFeedback(t('import.summary', { created: imported.created, failed: imported.failed }))
            await queryClient.invalidateQueries({ queryKey: importTarget === 'equipment' ? ['equipment'] : ['trucks'] })
          }
        }}
        onClose={() => setImportTarget(null)}
      />
    </>
  )
}

function localizeFleetImportError(
  t: (key: string) => string,
  target: 'trucks' | 'equipment' | null,
  error: SpreadsheetImportError,
): string {
  const message = error.message.toLowerCase()
  if (target === 'trucks') {
    if (error.field === 'plate_number' && (message.includes('already') || message.includes('taken'))) {
      return t('fleet.importPlateTaken')
    }
    if (error.field === 'type') {
      return t('fleet.importTypeInvalid')
    }
    if (error.field === 'capacity_tons') {
      return t('fleet.importCapacityInvalid')
    }
  }
  if (target === 'equipment') {
    if (error.field === 'truck_plate') {
      return t('fleet.importTruckMissing')
    }
    if (error.field === 'quantity') {
      return t('fleet.importQuantityInvalid')
    }
    if (error.field === 'name') {
      return t('fleet.importNameRequired')
    }
  }
  return error.message
}
