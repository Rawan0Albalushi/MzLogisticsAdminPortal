interface RouteLabelProps {
  from: string
  to: string
}

export function RouteLabel({ from, to }: RouteLabelProps) {
  return (
    <span className="mz-route">
      <span>{from}</span>
      <span className="mz-route__arrow" aria-hidden="true">
        →
      </span>
      <span>{to}</span>
    </span>
  )
}
