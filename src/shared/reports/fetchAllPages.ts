import type { Paginated } from '@/core/api/types.ts'

const EXPORT_PAGE_SIZE = 100
const EXPORT_MAX_RECORDS = 2000

export async function fetchAllPages<T>(
  fetchPage: (page: number, perPage: number) => Promise<Paginated<T>>,
): Promise<T[]> {
  const first = await fetchPage(1, EXPORT_PAGE_SIZE)
  const items = [...first.items]
  const lastPage = first.meta?.last_page ?? 1
  const pageLimit = Math.min(lastPage, Math.ceil(EXPORT_MAX_RECORDS / EXPORT_PAGE_SIZE))

  for (let page = 2; page <= pageLimit && items.length < EXPORT_MAX_RECORDS; page += 1) {
    const next = await fetchPage(page, EXPORT_PAGE_SIZE)
    items.push(...next.items)
    if (next.items.length === 0) {
      break
    }
  }

  return items.slice(0, EXPORT_MAX_RECORDS)
}
