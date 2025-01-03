import { ReactNode } from 'react'

interface AddressInfoProps {
  title: string
  info: ReactNode
  textClassName?: string
}

export const AddressInfo: React.FC<AddressInfoProps> = ({
  title,
  info,
  textClassName
}: AddressInfoProps) => {
  return (
    <div className="flex flex-col items-start gap-3">
      <span className="text-[#00000080] text-lg">{title}</span>
      <span className={textClassName}>{info}</span>
    </div>
  )
}
