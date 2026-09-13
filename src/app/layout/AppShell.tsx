import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '@/app/layout/Sidebar.tsx'
import { TopBar } from '@/app/layout/TopBar.tsx'

export function AppShell() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="mz-app">
      {open ? <div className="mz-sidebar-backdrop" onClick={() => setOpen(false)} /> : null}
      <Sidebar open={open} onNavigate={() => setOpen(false)} />
      <div className="mz-shell">
        <TopBar onMenu={() => setOpen((value) => !value)} />
        <main className="mz-content">
          <div key={location.pathname} className="mz-page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
