import { notifications } from '@mantine/notifications'
import { AiOutlineCopy } from 'react-icons/ai'

interface CopyIconProps {
  text: string
  iconSize?: number
}

export const CopyIcon: React.FC<CopyIconProps> = ({ text, iconSize }: CopyIconProps) => {
  return (
    <AiOutlineCopy
      color="#1677FF"
      size={iconSize}
      onClick={() => {
        navigator.clipboard
          .writeText(text)
          .then(() => {
            notifications.show({
              color: 'green',
              title: 'Text copied',
              message: text
            })
          })
          .catch((err) =>
            notifications.show({
              color: 'red',
              title: 'Cannot copy text',
              message: err.message
            })
          )
      }}
    />
  )
}
