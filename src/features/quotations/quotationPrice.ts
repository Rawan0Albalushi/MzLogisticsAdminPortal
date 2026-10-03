export function billableTripCount(truckCount: number, tripCount: number): number | null {
  if (!Number.isInteger(truckCount) || truckCount < 1 || !Number.isInteger(tripCount) || tripCount < 1) {
    return null
  }

  return Math.max(truckCount, tripCount)
}

export function quotationTotal(pricePerTrip: number, trips: number): number {
  return Math.round((pricePerTrip * trips + Number.EPSILON) * 1000) / 1000
}
