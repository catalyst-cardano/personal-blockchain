import { CopyableEllipsis } from '@renderer/components/shared'
import { hexToString } from '@renderer/helpers'

interface TokenCardProps {
  tokenName: string
  tokenAmount: number
  fingerprint: string
  policyId: string
}

export const TokenCard: React.FC<TokenCardProps> = ({
  tokenName,
  tokenAmount,
  fingerprint,
  policyId
}: TokenCardProps) => {
  return (
    <div className="flex flex-col justify-between items-center bg-white p-2 rounded-lg mb-6 min-w-64 border-[1px] border-[#0000001A]">
      <div className="flex flex-row w-full justify-between items-center">
        <p className="text-primary-blue font-medium text-xs">{hexToString(tokenName)}</p>
        <p className="font-bold text-xl">{tokenAmount.toLocaleString()}</p>
      </div>
      <div className="flex flex-row w-full justify-between items-center">
        <p className="text-[#00000080] text-xs">Fingerprint</p>
        <p>
          <CopyableEllipsis text={fingerprint} />
        </p>
      </div>
      <div className="flex flex-row w-full justify-between items-center">
        <p className="text-[#00000080] text-xs">Policy ID</p>
        <p>
          <CopyableEllipsis text={policyId} />
        </p>
      </div>
    </div>
  )
}
