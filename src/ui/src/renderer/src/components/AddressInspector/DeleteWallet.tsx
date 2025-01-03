import { Button, LoadingOverlay, Modal } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { CARDANO_WALLET_URL } from '@renderer/constants/const'
import { ellipsisText, saveToLocalStorage } from '@renderer/helpers'
import { AddressContext } from '@renderer/hooks/useAddress'
import { AddressInformation } from '@renderer/interfaces/Wallet'
import axios from 'axios'
import React from 'react'
import { useState } from 'react'

interface DeleteWalletProps {
  walletId: string
  address?: string
  opened: boolean
  close: () => void
  setAddressInfo: React.Dispatch<React.SetStateAction<AddressInformation | undefined>>
}

export const DeleteWallet: React.FC<DeleteWalletProps> = ({
  walletId,
  address,
  opened,
  close,
  setAddressInfo
}: DeleteWalletProps) => {
  const [isDeleteing, setIsDeleting] = useState(false)
  const addressContext = React.useContext(AddressContext)

  const deleteWallet = async (): Promise<void> => {
    setIsDeleting(true)
    axios
      .delete(`${CARDANO_WALLET_URL}/v2/wallets/${walletId}`)
      .then(() => {
        addressContext?.addressToWalletInfo.delete(address!)
        saveToLocalStorage(addressContext?.addressToWalletInfo)
        setAddressInfo(undefined)
        notifications.show({
          color: 'green',
          title: `Deleted the wallet sucessfully`,
          message: address
        })
        close()
      })
      .catch((err) => {
        notifications.show({
          color: 'red',
          title: `Error deleting wallet ${walletId}`,
          message: err.message
        })
      })
      .finally(() => {
        setIsDeleting(false)
      })
  }

  return (
    <Modal opened={opened} onClose={close} withCloseButton={false} size="lg">
      <div className="flex flex-col text-center relative">
        <LoadingOverlay
          visible={isDeleteing}
          zIndex={1000}
          overlayProps={{ radius: 'sm', blur: 2 }}
        />
        <p className="text-2xl font-bold">Are you sure to delete the wallet?</p>
        <div className="text-xl font-medium my-5">
          <p>Address: {ellipsisText(address || '', 10, 4)}</p>
          <p>ID: {walletId}</p>
        </div>
        <div className="flex flex-row gap-2 justify-center">
          <Button
            variant="outline"
            color="#1677FF"
            size="lg"
            styles={{
              root: {
                fontSize: 20
              }
            }}
            onClick={close}
          >
            Cancel
          </Button>
          <Button
            variant="filled"
            color="red"
            size="lg"
            styles={{
              root: {
                fontSize: 20
              }
            }}
            onClick={deleteWallet}
          >
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  )
}
