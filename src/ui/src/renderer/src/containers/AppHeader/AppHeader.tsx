import React, { useEffect, useState } from 'react'
import { AppShell, Burger, Button, LoadingOverlay, useCombobox } from '@mantine/core'
import { useLocation } from 'react-router-dom'
import { GoServer } from 'react-icons/go'
import { VscGlobe } from 'react-icons/vsc'
import { BLOCKFROST_URL, LOCAL_STORAGE_KEY } from '@renderer/constants/const'
import { FiBox } from 'react-icons/fi'
import { RiRocket2Line } from 'react-icons/ri'
import axios from 'axios'
import { notifications } from '@mantine/notifications'

interface AppHeaderProps {
  toggleNavBar: () => void
}

export const AppHeader: React.FC<AppHeaderProps> = ({ toggleNavBar }: AppHeaderProps) => {
  const location = useLocation()
  const epochLength =
    location.pathname == '/' ? '' : localStorage.getItem(LOCAL_STORAGE_KEY.EPOCH_LENGTH)
  const transactionSize =
    location.pathname == '/' ? '' : localStorage.getItem(LOCAL_STORAGE_KEY.TRANSACTION_SIZE)

  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption()
  })

  const [latestBlock, setLatestBlock] = useState()
  const [slotNumber, setSlotNumber] = useState()
  const [fetchingLatestBlock, setFetchingLatestBlock] = useState(false)

  useEffect(() => {
    setFetchingLatestBlock(true)
    axios
      .get(`${BLOCKFROST_URL}/blocks/latest`)
      .then((result) => {
        setLatestBlock(result.data.height)
        setSlotNumber(result.data.slot)
      })
      .catch((err) => {
        notifications.show({
          color: 'red',
          title: `Error fetching latest block`,
          message: err.message
        })
      })
      .finally(() => {
        setFetchingLatestBlock(false)
      })
  }, [location])

  return (
    <AppShell.Header className="flex flex-row justify-between px-4 py-4">
      <Burger w={24} h={24} className="self-center !outline-none" onClick={toggleNavBar} />
      <div className="flex flex-row justify-between gap-6 items-center w-max text-[#434657]">
        <div className="flex flex-row gap-1 items-center relative">
          <LoadingOverlay
            visible={fetchingLatestBlock}
            zIndex={1000}
            overlayProps={{ radius: 'sm', blur: 2 }}
          />
          <FiBox color="#00000080" size={20} />
          {`Latest Block: ${latestBlock ?? '_'}`}
        </div>
        <div className="flex flex-row gap-1 items-center relative">
          <LoadingOverlay
            visible={fetchingLatestBlock}
            zIndex={1000}
            overlayProps={{ radius: 'sm', blur: 2 }}
          />
          <RiRocket2Line color="#00000080" size={20} />
          {`Slot Number: ${slotNumber ?? '_'}`}
        </div>
        <div className="flex flex-row gap-1 items-center">
          <VscGlobe size={20} />
          {`Epoch Length: ${epochLength ? `${epochLength}s` : '_'}`}
        </div>
        <div className="flex flex-row gap-1 items-center">
          <GoServer size={20} />
          Transaction Size:{' '}
          <span className="font-bold">{transactionSize ? `${transactionSize} bytes` : '_'} </span>
        </div>
        {location.pathname != '/' && (
          <a href="#/">
            <Button className="bg-primary-blue rounded-md">+ New Workspace</Button>
          </a>
        )}
      </div>
    </AppShell.Header>
  )
}
