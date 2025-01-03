import { ellipsisText } from '@renderer/helpers'
import { CopyIcon } from './CopyIcon'

interface CopyableEllipsisProps {
  text: string
  textClassNames?: string
  prefixLength?: number
  suffixLength?: number
  iconSize?: number
  copyable?: boolean
}

export const CopyableEllipsis: React.FC<CopyableEllipsisProps> = ({
  text,
  textClassNames,
  prefixLength = 6,
  suffixLength = 6,
  iconSize = 24,
  copyable = true
}: CopyableEllipsisProps) => {
  return (
    <div className="flex flex-row gap-2 items-center">
      <p className={textClassNames}>{ellipsisText(text, prefixLength, suffixLength)}</p>
      {copyable && <CopyIcon text={text} iconSize={iconSize} />}
    </div>
  )
}
