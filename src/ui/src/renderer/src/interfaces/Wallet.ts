export interface AddressInformation {
  addressType: string
  address: string
  addressHex: string
  paymentCredential: string
  stakeAddress: string
  stakeCredential: string
}

export interface Asset {
  policy_id: string
  asset_name: string
  quantity: number
}

export interface Wallet {
  id: string
  address_pool_gap: number
  balance: {
    available: {
      quantity: number
      unit: string
    }
    reward: {
      quantity: number
      unit: string
    }
    total: {
      quantity: number
      unit: string
    }
  }
  total: {
    quantity: number
    unit: string
  }
  assets: {
    avaiable: Asset[]
    total: Asset[]
  }
  delegation: {
    active: {
      status: string
      target: string
      voting: string
    }
    next: {
      status: string
      target: string
      voting: string
      charges_at: {
        epoch_number: number
        epoch_start_time: string
      }
    }[]
  }
  name: string
  passphrase: {
    last_updated_at: string
  }
  state: {
    status: string
    progress: {
      quantity: number
      unit: string
    }
  }
  tip: {
    absolute_slot_number: number
    slot_number: number
    epoch_number: number
    time: string
    height: {
      quantity: number
      unit: string
    }
  }
}
