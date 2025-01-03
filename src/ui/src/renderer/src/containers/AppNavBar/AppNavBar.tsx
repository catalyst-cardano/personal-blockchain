import React from 'react'
import danogoLogo from '@renderer/assets/Logo.png'
import { AppShell } from '@mantine/core'
import { BiLogOut } from 'react-icons/bi'
import { LuWallet, LuCompass } from 'react-icons/lu'
import { useLocation } from 'react-router-dom'
import { RiMoneyDollarCircleLine } from 'react-icons/ri'

interface AppNavBarProps {
  closeNavbar: () => void
  devMode: boolean
}

export const AppNavBar: React.FC<AppNavBarProps> = ({ closeNavbar, devMode }: AppNavBarProps) => {
  const location = useLocation()

  return (
    <AppShell.Navbar p="md" className="flex flex-col justify-between items-center bg-[#1B1D29]">
      <div className="w-full">
        <div className="px-4 py-10">
          <a href="#">
            <img className="mx-auto" alt="logo" src={danogoLogo} width={100} height={40} />
          </a>
        </div>

        <div className="text-white">
          <a className="flex flex-row py-2.5 px-6 gap-2 items-center" href="#/address-inspector">
            <LuWallet width={20} height={20} />
            <p className={location.pathname == '/address-inspector' ? 'text-primary-blue' : ''}>
              Addresses
            </p>
          </a>
          <a className="flex flex-row py-2.5 px-6 gap-2 items-center" href="#/transactions">
            <LuCompass />
            <p className={location.pathname.startsWith('/transaction') ? 'text-primary-blue' : ''}>
              Transactions
            </p>
          </a>
          {devMode && (
            <a className="flex flex-row py-2.5 px-6 gap-2 items-center" href="#/mint">
              <RiMoneyDollarCircleLine />
              <p className={location.pathname.startsWith('/mint') ? 'text-primary-blue' : ''}>
                Mint
              </p>
            </a>
          )}
        </div>
      </div>
      <div
        className="text-[#82869E] flex flex-row gap-2 justify-center items-center"
        onClick={closeNavbar}
      >
        <BiLogOut />
        Hide
      </div>
    </AppShell.Navbar>
  )
}
