'use client'

import SelectedWallet from "./SelectedWallet"
import { WalletError } from "./WalletError"
import WalletList from "./WalletList"

export default function Dashboard() {

  return(
    <div>
      <h1 className="text-center">Dashboard</h1>
      <WalletList />
      <SelectedWallet />
      <WalletError/>
    </div>
  )
}