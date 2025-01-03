import classes from './NewWorkspace.module.css'
import {
  Button,
  createTheme,
  Group,
  LoadingOverlay,
  MantineProvider,
  NumberInput,
  Stack
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { LOCAL_STORAGE_KEY } from '@renderer/constants/const'
import { AddressContext } from '@renderer/hooks/useAddress'
import axios from 'axios'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const theme = createTheme({
  components: {
    NumberInput: NumberInput.extend({
      classNames: {
        root: classes.root,
        input: classes.input,
        description: classes.description,
        label: classes.label
      }
    })
  }
})

export const NewWorkspace: React.FC = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const addressContext = React.useContext(AddressContext)

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      slotLength: 1,
      epochLength: 3600,
      transactionSize: 4096
    },

    validate: {
      slotLength: (value) => (value ? null : 'Slot Length required'),
      epochLength: (value) => (value ? null : 'Epoch Length required'),
      transactionSize: (value) => (value ? null : 'Transaction Size required')
    }
  })
  return (
    <MantineProvider theme={theme}>
      <div>
        <div className="p-4 text-2xl font-semibold relative">New workspace</div>
        <LoadingOverlay
          visible={isLoading}
          zIndex={1000}
          overlayProps={{ radius: 'sm', blur: 2 }}
        />
        <div className="flex items-center flex-col mt-20">
          <div className="mx-52">
            <form
              onSubmit={form.onSubmit((values) => {
                setIsLoading(true)
                axios
                  .post('http://localhost:8888/workspace', {
                    name: 'Workspace name',
                    slotLength: values.slotLength,
                    epochLength: values.epochLength,
                    txSize: values.transactionSize
                  })
                  .then((result) => {
                    if (result.status == 200 || result.status == 201) {
                      localStorage.setItem(
                        LOCAL_STORAGE_KEY.TRANSACTION_SIZE,
                        values.transactionSize.toString()
                      )
                      localStorage.setItem(
                        LOCAL_STORAGE_KEY.EPOCH_LENGTH,
                        values.epochLength.toString()
                      )
                      addressContext?.addressToWalletInfo.clear()
                      localStorage.setItem(LOCAL_STORAGE_KEY.ADDRESSES, '[]')
                      navigate('/address-inspector')
                    }
                  })
                  .catch((err) => {
                    notifications.show({
                      color: 'red',
                      title: 'Error while creating a workspace',
                      message: err.message
                    })
                  })
                  .finally(() => {
                    setIsLoading(false)
                  })
              })}
            >
              <Stack gap="lg" className="mb-12">
                <p className="text-2xl font-semibold">Blockchain Config</p>
                <NumberInput
                  label={
                    <p>
                      <span className="text-red-error">*</span> Slot Length (seconds)
                    </p>
                  }
                  allowNegative={false}
                  allowDecimal={false}
                  key={form.key('slotLength')}
                  {...form.getInputProps('slotLength')}
                />
                <NumberInput
                  label={
                    <p>
                      <span className="text-red-error">*</span> Epoch Length
                    </p>
                  }
                  allowNegative={false}
                  allowDecimal={false}
                  description="Number of slots in an epoch"
                  key={form.key('epochLength')}
                  {...form.getInputProps('epochLength')}
                />
                <NumberInput
                  label={
                    <p>
                      <span className="text-red-error">*</span> Transaction Size (bytes)
                    </p>
                  }
                  allowNegative={false}
                  allowDecimal={false}
                  description="A simple transaction with one input and one output may have a size of about 200-300 bytes. Transactions with multiple inputs, outputs, or containing metadata can be significantly larger, with sizes potentially reaching several kilobytes (KB)."
                  key={form.key('transactionSize')}
                  {...form.getInputProps('transactionSize')}
                />
              </Stack>
              <Group justify="flex-end" mt="lg">
                <Button
                  className="rounded-lg px-10 bg-secondary-blue text-primary-blue border-primary-blue"
                  onClick={() => {
                    form.reset()
                  }}
                >
                  Cancel
                </Button>
                <Button className="rounded-lg px-10 bg-primary-blue" type="submit">
                  Start
                </Button>
              </Group>
            </form>
          </div>
        </div>
      </div>
    </MantineProvider>
  )
}
