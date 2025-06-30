import { useContext } from "react"
import { WalletProviderContext } from "./WalletProvider"

/**
 * Custom hook that simplifies the process of consuming the WalletProviderContext
 * The benefit of this separate file exporting the hook is that components can directly call useWalletProvider() 
 * instead of useContext(WalletProviderContext), making the code cleaner and more readable.
 */
export const useWalletProvider = () => {
  const context = useContext(WalletProviderContext)
  if (!context) {
    throw new Error('useWalletProvider must be used within a WalletProvider')
  }
  return context

}