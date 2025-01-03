import { LOCAL_STORAGE_KEY } from '@renderer/constants/const'
import { WalletInfo } from '@renderer/hooks/useAddress'
import { createBrowserHistory } from 'history'

export const browserHistory = createBrowserHistory()

export const ellipsisText = (text: string, prefixLength: number, suffixLength: number): string => {
  return text ? text.slice(0, prefixLength) + '...' + text.slice(text.length - suffixLength) : ''
}

export const lovelaceToAda = (value?: string | number): string => {
  if (!value) return '0'
  return (Number((BigInt(value) * 100n) / BigInt(1000000)) / 100).toLocaleString('en-US')
}

export const formatEpochToDatetime = (epoch): string => {
  const date = new Date(epoch * 1000) // Convert epoch to milliseconds

  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
  const dateFormatter = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  const time = timeFormatter.format(date)
  const formattedDate = dateFormatter.format(date)

  return `${time} ${formattedDate}`
}

export const hexToString = (hex: string): string => {
  return Buffer.from(hex, 'hex').toString()
}

export const unitToAssetName = (unit: string): string => {
  return unit == 'lovelace' ? unit : hexToString(unit.slice(56))
}

export const saveToLocalStorage = (map?: Map<string, WalletInfo>): void => {
  if (!map) return
  const array = Array.from(map.entries())
  localStorage.setItem(LOCAL_STORAGE_KEY.ADDRESSES, JSON.stringify(array))
}
