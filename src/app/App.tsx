import { AppProviders } from '@/app/providers.tsx'
import { AppRouter } from '@/app/router.tsx'

export default function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  )
}
