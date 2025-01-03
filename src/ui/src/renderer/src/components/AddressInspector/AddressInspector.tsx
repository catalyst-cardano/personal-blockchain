import classes from './AddressInspector.module.css'
import axios from 'axios'
import { generateMnemonic } from 'bip39'
import {
  Badge,
  Button,
  createTheme,
  Divider,
  Group,
  MantineProvider,
  Stack,
  TextInput,
  Text
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import React, { useState } from 'react'
import { AddressInfo } from './AddressInfo'
import { CopyableEllipsis } from '@renderer/components/shared'
import CreateWalletLogo from '@renderer/assets/Wallet.png'
import { TbLocation } from 'react-icons/tb'
import { TokenCard } from './TokenCard'
// import { Faucet } from '../Faucet/Faucet'
import { IoSearchSharp } from 'react-icons/io5'
import { CARDANO_WALLET_URL } from '@renderer/constants/const'
import AssetFingerprint from '@emurgo/cip14-js'
import { notifications } from '@mantine/notifications'
import { AddressContext } from '@renderer/hooks/useAddress'
import { AddressInformation, Wallet, Asset } from '@renderer/interfaces/Wallet'
import { hexToString, saveToLocalStorage } from '@renderer/helpers'
import { DeleteWallet } from './DeleteWallet'

export const AddressInspector: React.FC = () => {
  // const [opened, { open, close }] = useDisclosure(false)
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false)
  const [isSmartContract, setIsSmartContract] = useState(false)
  const [walletId, setWalletId] = useState('')
  const [addressInfo, setAddressInfo] = useState<AddressInformation>()
  const [walletAssets, setWalletAssets] = useState<Asset[]>()
  const [walletADA, setWalletADA] = useState<number>()
  const [searchAssets, setSearchAssets] = useState<Asset[]>()
  const addressContext = React.useContext(AddressContext)

  const theme = createTheme({
    components: {
      TextInput: TextInput.extend({
        classNames: {
          label: classes.inputLabel,
          section: classes.section
        }
      }),
      Button: Button.extend({
        classNames: {
          root: classes.buttonRoot,
          inner: classes.buttonInner
        }
      })
    }
  })

  const addressForm = useForm({
    mode: 'uncontrolled',
    initialValues: {
      address: ''
    },

    validate: {
      address: (value) =>
        /^[a-zA-Z0-9_]*$/.test(value) ? null : 'Only alphanumeric characters are allowed'
    }
  })

  const tokenForm = useForm({
    mode: 'uncontrolled',
    initialValues: {
      searchToken: ''
    },

    validate: {
      searchToken: (value) =>
        /^[a-zA-Z0-9]*$/.test(value) ? null : 'Only alphanumeric characters are allowed'
    }
  })

  const getWalletInfoAndAssets = (walletId?: string, mnemonic = ''): void => {
    if (!walletId) {
      notifications.show({
        color: 'red',
        title: 'Address not found',
        message: `The address does not exist`
      })
      return
    }
    axios
      .get<Wallet>(`${CARDANO_WALLET_URL}/v2/wallets/${walletId}`)
      .then((result) => {
        setWalletAssets(result.data.assets.total)
        setWalletADA(result.data.balance.total.quantity / 1000000)
        setSearchAssets(
          result.data.assets.total.sort((a, b) => {
            const nameA = hexToString(a.asset_name)
            const nameB = hexToString(b.asset_name)
            return nameA.localeCompare(nameB, undefined, { sensitivity: 'case' })
          })
        )
      })
      .catch((err) => {
        notifications.show({
          color: 'red',
          title: 'Error while fetching the wallet assets',
          message: err.message
        })
      })
    axios
      .get(`${CARDANO_WALLET_URL}/v2/wallets/${walletId}/addresses`)
      .then((result) => {
        const address = result.data[0].id
        if (mnemonic) {
          addressContext?.addressToWalletInfo.set(address, {
            walletId: walletId,
            mnemonic: mnemonic
          })
          saveToLocalStorage(addressContext?.addressToWalletInfo)
        }
        axios
          .get(`${CARDANO_WALLET_URL}/v2/addresses/${address}`)
          .then((result) => {
            const addressInfo = result.data
            const addressType =
              result.data.address_type <= 3
                ? 'BASE'
                : result.data.address_type <= 5
                  ? 'POINTER'
                  : result.data.address_type <= 7
                    ? 'ENTERPRISE'
                    : result.data.address_type == 8
                      ? 'BYRON/ICARUS'
                      : 'REWARD'
            setIsSmartContract(result.data.script_hash)
            setAddressInfo({
              address: address,
              addressType: addressType,
              addressHex: '00' + addressInfo.spending_key_hash,
              paymentCredential: addressInfo.spending_key_hash,
              stakeAddress: addressInfo.stake_key_hash_bech32,
              stakeCredential: addressInfo.stake_key_hash
            })
          })
          .catch((err) => {
            notifications.show({
              color: 'red',
              title: 'Error while fetching the address information',
              message: err.message
            })
          })
      })
      .catch((err) => {
        notifications.show({
          color: 'red',
          title: 'Error while fetching the wallet addresses',
          message: err.message
        })
      })
  }

  return (
    <MantineProvider theme={theme}>
      <div className="">
        <div className="p-4 text-2xl font-semibold">Address</div>
        <div className="flex flex-col mt-12">
          <Stack className="mx-[50px]" gap="lg">
            <div>
              <Group justify="flex-start" mt="md" className="items-end">
                <form
                  name="addressForm"
                  onSubmit={addressForm.onSubmit((values) => {
                    if (values.address)
                      getWalletInfoAndAssets(
                        addressContext?.addressToWalletInfo.get(values.address)?.walletId
                      )
                  })}
                >
                  <TextInput
                    className="w-[40vw]"
                    radius="md"
                    // searchable
                    label="Address"
                    leftSection={<IoSearchSharp color="#00000073" />}
                    rightSection={
                      <p
                        className="text-sm text-[#1677FF] bg-white"
                        onClick={() => {
                          document.forms['addressForm'].requestSubmit()
                        }}
                      >
                        Search
                      </p>
                    }
                    placeholder="Search by Address"
                    key={addressForm.key('address')}
                    {...addressForm.getInputProps('address')}
                    maxLength={250}
                    error={addressForm.errors.address ? true : false}
                    onBlur={() => {
                      document.forms['addressForm'].requestSubmit()
                    }}
                  />
                </form>
                <Button
                  variant="outline"
                  color="#1677FF"
                  leftSection={<img src={CreateWalletLogo} />}
                  onClick={async () => {
                    const mnemonic = generateMnemonic(256)
                    axios
                      .post(`${CARDANO_WALLET_URL}/v2/wallets`, {
                        name: 'test',
                        mnemonic_sentence: mnemonic.split(' '),
                        passphrase: '1234567890'
                      })
                      .then((result) => {
                        setWalletId(result.data.id)
                        getWalletInfoAndAssets(result.data.id, mnemonic)
                      })
                      .catch((err) => {
                        notifications.show({
                          color: 'red',
                          title: 'Error while creating a wallet',
                          message: err.message
                        })
                      })
                  }}
                >
                  <p>Create Wallet</p>
                </Button>
                <a href="#/send-tokens">
                  <Button
                    type="submit"
                    leftSection={<TbLocation />}
                    variant="outline"
                    color="#1677FF"
                  >
                    Send Token
                  </Button>
                </a>
              </Group>
              {addressForm.errors.address && (
                <Text size="xs" c={'red'}>
                  {addressForm.errors.address}
                </Text>
              )}
            </div>
            {addressInfo && (
              <div className="bg-[#00000008] flex flex-col px-8 py-2">
                <div className="flex flex-row justify-between items-center">
                  <div className="flex flex-row gap-3 items-center">
                    {isSmartContract && (
                      <Badge size="lg" radius="sm" color="#FFC069">
                        <p className="text-[#5C0011]">SC Address</p>
                      </Badge>
                    )}
                    <p className="text-[#00000080] text-lg">Address:</p>
                    <CopyableEllipsis
                      text={addressInfo.address}
                      textClassNames="text-[#000000CC] font-medium text-lg"
                      prefixLength={14}
                      suffixLength={4}
                    />
                  </div>
                  <div className="flex flex-row gap-2">
                    <Button variant="filled" color="red" onClick={openDelete}>
                      Delete
                    </Button>
                    {/* <Button variant="outline" color="#1677FF" onClick={open}>
                      + Faucet
                    </Button> */}
                  </div>
                </div>
                <Divider className="mt-3 py-2" color="#00000080" size={'xs'} />
                <div className="flex flex-row justify-between items-center">
                  <AddressInfo
                    title="Address Type"
                    info={addressInfo.addressType}
                    textClassName="font-medium"
                  />
                  <AddressInfo
                    title="Address (Hex format)"
                    info={
                      <CopyableEllipsis text={addressInfo.addressHex} textClassNames="text-lg" />
                    }
                  />
                  <AddressInfo
                    title="Payment Credential"
                    info={
                      <CopyableEllipsis
                        text={addressInfo.paymentCredential}
                        textClassNames="text-lg"
                      />
                    }
                  />
                  <AddressInfo
                    title="Stake Address"
                    info={
                      <CopyableEllipsis text={addressInfo.stakeAddress} textClassNames="text-lg" />
                    }
                  />
                  <AddressInfo
                    title="Stake Credential"
                    info={
                      <CopyableEllipsis
                        text={addressInfo.stakeCredential}
                        textClassNames="text-lg"
                      />
                    }
                  />
                </div>
              </div>
            )}
            {addressInfo && (
              <div className="bg-[#00000008] flex flex-col px-8 py-2">
                <div className="flex flex-row justify-between items-center">
                  <div className="flex flex-row gap-2 items-center">
                    <p className="font-medium text-lg">Token List</p>
                    <Badge size="lg" radius="lg" color="#F9F5FF">
                      <p className="text-[#6941C6]">{walletAssets?.length ?? 0} Token</p>
                    </Badge>
                  </div>
                  <form
                    name="tokenForm"
                    onSubmit={tokenForm.onSubmit((values) => {
                      if (values.searchToken) {
                        setSearchAssets(
                          walletAssets
                            ?.filter(
                              (asset) =>
                                hexToString(asset.asset_name).includes(values.searchToken) ||
                                asset.policy_id.includes(values.searchToken) ||
                                AssetFingerprint.fromParts(
                                  Buffer.from(asset.policy_id, 'hex'),
                                  Buffer.from(asset.asset_name, 'hex')
                                )
                                  .fingerprint()
                                  .includes(values.searchToken)
                            )
                            .sort((a, b) => {
                              const nameA = hexToString(a.asset_name)
                              const nameB = hexToString(b.asset_name)
                              return nameA.localeCompare(nameB, undefined, { sensitivity: 'case' })
                            })
                        )
                      } else {
                        setSearchAssets(walletAssets)
                      }
                    })}
                  >
                    <TextInput
                      className="w-[40vw]"
                      radius="sm"
                      withAsterisk
                      placeholder="Search token by Name, Policy ID or Fingerprint"
                      key={tokenForm.key('searchToken')}
                      {...tokenForm.getInputProps('searchToken')}
                      maxLength={250}
                      onBlur={() => {
                        document.forms['tokenForm'].requestSubmit()
                      }}
                    />
                  </form>
                </div>
                <div className="flex flex-row gap-5 items-center flex-wrap mt-5">
                  {[
                    {
                      policy_id: '',
                      asset_name: '414441',
                      quantity: walletADA || 0
                    },
                    ...(searchAssets || [])
                  ]?.map((item, index) => (
                    <TokenCard
                      key={index}
                      tokenName={item.asset_name}
                      tokenAmount={item.quantity}
                      fingerprint={
                        item.asset_name == '414441'
                          ? ''
                          : AssetFingerprint.fromParts(
                              Buffer.from(item.policy_id, 'hex'),
                              Buffer.from(item.asset_name, 'hex')
                            ).fingerprint()
                      }
                      policyId={item.policy_id}
                    />
                  ))}
                </div>
              </div>
            )}
          </Stack>
        </div>
      </div>
      {/* {opened && (
        <Faucet opened={opened} close={close} address={addressInfo ? addressInfo.address : ''} />
      )} */}
      {deleteOpened && (
        <DeleteWallet
          opened={deleteOpened}
          close={closeDelete}
          walletId={walletId}
          address={addressInfo?.address}
          setAddressInfo={setAddressInfo}
        />
      )}
    </MantineProvider>
  )
}
