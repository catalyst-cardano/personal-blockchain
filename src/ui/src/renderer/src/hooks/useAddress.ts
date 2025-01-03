import { createContext } from 'react'

export interface WalletInfo {
  walletId: string
  mnemonic: string
}

interface AddressContextType {
  addressToWalletInfo: Map<string, WalletInfo>
}

export const AddressContext = createContext<AddressContextType | undefined>(undefined)
