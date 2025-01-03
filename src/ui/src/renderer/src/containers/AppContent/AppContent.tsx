import React from 'react'
import { Route, Routes } from 'react-router-dom'
import { NewWorkspace } from '@renderer/components/NewWorkspace/NewWorkspace'
import { AddressInspector } from '@renderer/components/AddressInspector/AddressInspector'
// import { Transactions } from '@renderer/components/Transactions/Transactions'
// import { SendTokens } from '@renderer/components/SendTokens/SendTokens'
// import { TransactionDetails } from '@renderer/components/TransactionDetails/TransactionsDetails'
// import { Mint } from '@renderer/components/Mint/Mint'

export const AppContent: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<NewWorkspace />} />
      <Route path="/address-inspector" element={<AddressInspector />} />
      {/* <Route path="/transactions" element={<Transactions />} />
      <Route path="/send-tokens" element={<SendTokens />} />
      <Route path="/transaction-details/*" element={<TransactionDetails />} />
      <Route path="/mint" element={<Mint />} /> */}
    </Routes>
  )
}
