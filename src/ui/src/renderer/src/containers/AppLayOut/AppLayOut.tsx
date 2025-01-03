import React from 'react'
import { AppShell } from '@mantine/core'
import { AppNavBar } from '@renderer/containers/AppNavBar'
import { AppHeader } from '@renderer/containers/AppHeader'
import { AppContent } from '@renderer/containers/AppContent'
import { useLocation } from 'react-router-dom'
import { useDisclosure } from '@mantine/hooks'

export const AppLayOut: React.FC<{ devMode }> = ({ devMode }) => {
  const location = useLocation()
  const currentPath = location.pathname
  const [navbarOpened, { toggle: toggleNavbar, close: closeNavbar }] = useDisclosure(true)

  return (
    <AppShell
      layout="alt"
      header={{ height: 85 }}
      navbar={{
        width: 300,
        breakpoint: 0,
        collapsed: { desktop: !navbarOpened }
      }}
    >
      <AppNavBar closeNavbar={closeNavbar} devMode={devMode} />
      <AppHeader toggleNavBar={toggleNavbar} />
      <AppShell.Main
        className={currentPath.startsWith('/transaction') ? 'bg-[#F3F3F3]' : 'bg-white'}
      >
        <AppContent />
      </AppShell.Main>
    </AppShell>
  )
}
