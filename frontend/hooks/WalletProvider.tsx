'use client';
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useEffect,
  useState,
} from "react"


// Explicitly declaring the custom eip6963:announceProvider event prevents type errors, enables proper type checking, and supports autocompletion in TypeScript.
declare global {
  interface WindowEventMap {
    "eip6963:announceProvider": CustomEvent
  }
}

// Type alias for a record where the keys are wallet identifiers and the values are account
// addresses or null.
type SelectedAccountByWallet = Record<string, string | null>

// Context interface for the EIP-6963 provider.
interface WalletProviderContext {
  wallets: Record<string, EIP6963ProviderDetail> // A list of wallets.
  selectedWallet: EIP6963ProviderDetail | null // The selected wallet.
  selectedAccount: string | null // The selected account address.
  errorMessage: string | null // An error message.
  connectWallet: (walletRdns: string) => Promise<void> // Function to connect wallets.
  disconnectWallet: () => void // Function to disconnect wallets.
  clearError: () => void
}

export const WalletProviderContext = createContext<WalletProviderContext | null>(null);

// The WalletProvider component wraps all other components in the dapp, providing them with the
// necessary data and functions related to wallets.
export const WalletProvider:React.FC<PropsWithChildren>= ({children}) => {

  // State to hold detected wallets.
  const [wallets, setWallets] = useState<Record<string, EIP6963ProviderDetail>>({});
  
  // State to hold the Reverse Domain Name System (RDNS) of the selected wallet.
  const [selectedWalletRdns, setSelectedWalletRdns] = useState<string | null>(null);

  // State to hold accounts associated with each wallet.
  const [selectedAccountByWalletRdns, setSelectedAccountByWalletRdns] = useState<SelectedAccountByWallet>({});

  const [errorMessage, setErrorMessage] = useState("");
  const clearError = () => setErrorMessage("");
  const setError = (error: string) => setErrorMessage(error);

  useEffect(()=>{
    // On mount, it retrieves the saved selected wallet and accounts from local storage.
    const savedSelectedWalletRdns = localStorage.getItem("selectedWalletRdns")
    const savedSelectedAccountByWalletRdns = localStorage.getItem("selectedAccountByWalletRdns")

    if (savedSelectedAccountByWalletRdns) {
      setSelectedAccountByWalletRdns(JSON.parse(savedSelectedAccountByWalletRdns))
    }

    //  When the provider announces itself, it updates the state.
    function onAnnouncement(event: EIP6963AnnounceProviderEvent){
      setWallets(currentWallets => ({
        ...currentWallets,
        [event.detail.info.rdns]: event.detail
      }))
      if (savedSelectedWalletRdns && event.detail.info.rdns === savedSelectedWalletRdns) {
        setSelectedWalletRdns(savedSelectedWalletRdns)
      }
    }

    // It adds an event listener for the custom eip6963:announceProvider event.
    window.addEventListener("eip6963:announceProvider", onAnnouncement)
    // It dispatches an event to request existing providers.
    window.dispatchEvent(new Event("eip6963:requestProvider"))

    return () => window.removeEventListener("eip6963:announceProvider", onAnnouncement)

  }, [])

  // Connect a wallet and update the component's state
  const connectWallet = useCallback(
    async (walletRdns: string) => {
      try {
        const wallet = wallets[walletRdns]
        const accounts = (await wallet.provider.request({
          method: "eth_requestAccounts",
        })) as string[]
  
        if (accounts?.[0]) {
          setSelectedWalletRdns(wallet.info.rdns)
          setSelectedAccountByWalletRdns((currentAccounts) => ({
            ...currentAccounts,
            [wallet.info.rdns]: accounts[0],
          }))
  
          localStorage.setItem("selectedWalletRdns", wallet.info.rdns)
          localStorage.setItem(
            "selectedAccountByWalletRdns",
            JSON.stringify({
              ...selectedAccountByWalletRdns,
              [wallet.info.rdns]: accounts[0],
            })
          )
        }
      } catch (error) {
        console.error("Failed to connect to provider:", error)
        const walletError: WalletError = error as WalletError
        setError(
          `Code: ${walletError.code} \nError Message: ${walletError.message}`
        )
      }
    },
    [wallets, selectedAccountByWalletRdns]
  )

  // Disconnect wallet
   /**
   * When using disconnectWallet, each time the WalletProvider component re-renders without useCallback, a new instance of disconnectWallet is created. 
   * This can cause unnecessary re-renders of child components that depend on this function.
   * By memoizing it with useCallback, React keeps the function instance consistent between renders,
   * as long as its dependencies (wallets and selectedWalletRdns) haven't changed, preventing unnecessary re-renders of child components.
   */
  const disconnectWallet = useCallback(async () => {
    if (selectedWalletRdns) {
      setSelectedAccountByWalletRdns((currentAccounts) => ({
        ...currentAccounts,
        [selectedWalletRdns]: null,
      }))
  
      const wallet = wallets[selectedWalletRdns]
      setSelectedWalletRdns(null)
      localStorage.removeItem("selectedWalletRdns")
  
      try {
        await wallet.provider.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        })
      } catch (error) {
        console.error("Failed to revoke permissions:", error)
      }
    }
  }, [selectedWalletRdns, wallets])

  const contextValue: WalletProviderContext = {
    wallets,
    selectedWallet:
      selectedWalletRdns === null ? null : wallets[selectedWalletRdns],
    selectedAccount:
      selectedWalletRdns === null
        ? null
        : selectedAccountByWalletRdns[selectedWalletRdns],
    errorMessage,
    connectWallet,
    disconnectWallet,
    clearError,
  }

return(
  <WalletProviderContext.Provider value={contextValue}>
    {children}
  </WalletProviderContext.Provider>
)
}