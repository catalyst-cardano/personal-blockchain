import { createTheme, MantineProvider } from '@mantine/core'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import { AppLayOut } from './containers/AppLayOut/AppLayOut'
import { Notifications } from '@mantine/notifications'
import { useEffect, useState } from 'react'
import { AddressContext } from './hooks/useAddress'
import { useMap } from '@mantine/hooks'
import { LOCAL_STORAGE_KEY } from './constants/const'

const theme = createTheme({})

function App(): JSX.Element {
  const [devMode, setDevMode] = useState(false)

  useEffect(() => {
    const handleKeyPress = (e): void => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setDevMode((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return (): void => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [])

  const storedAddressData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY.ADDRESSES) ?? '[]')

  return (
    <AddressContext.Provider
      value={{
        addressToWalletInfo: useMap(storedAddressData)
      }}
    >
      <MantineProvider theme={theme}>
        <Notifications />
        <Router>
          <Routes>
            <Route path="/*" element={<AppLayOut devMode={devMode} />} />
          </Routes>
        </Router>
      </MantineProvider>
    </AddressContext.Provider>
  )
}

export default App
