/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react"
import { useSyncProviders } from "../hooks/useSyncProviders";
import { formatAddress } from "../utils/formatAddress";
import { formatBalance } from "../utils/formatBalance";

export default function WalletProviders() {

  const [selectedWallet, setSelectedWallet] = useState<EIP6963ProviderDetail>();
  const [userAccount, setUserAccount] = useState<string>("");
  const [accountBalance, setAccountBalance] = useState<string>("");
  const providers = useSyncProviders();

  const [errorMessage, setErrorMessage] = useState("")
  const clearError = () => setErrorMessage("")
  const setError = (error: string) => setErrorMessage(error)
  const isError = !!errorMessage;

  const [isLoading, setIsLoading] = useState<boolean>(false);
  

  useEffect(()=> {
    console.log('accountBalance', accountBalance)
  }, [accountBalance])

   // Connect to the selected provider using eth_requestAccounts.
  const handleConnect = async (providerWithInfo: EIP6963ProviderDetail) => {
    try {
      const accounts:string[] | undefined  = (await providerWithInfo.provider.request({ method: "eth_requestAccounts" })) as string[] | undefined;

      if(accounts?.[0] != undefined) {
        console.log('asd');
        setSelectedWallet(providerWithInfo);
        setUserAccount(accounts[0])
      }
    } catch (error) {
      console.error(error);
      const walletError: WalletError = error as WalletError
      setError(`Code: ${walletError.code} \nError Message: ${walletError.message}`)
    }
  }

  const checkAccountBalance = async (account:string, providerWithInfo: EIP6963ProviderDetail) => {
    console.log('checl ba;ance', providerWithInfo, account)
    try {
      setIsLoading(true);
      const balance: string | undefined = (await providerWithInfo.provider.request({method: "eth_getBalance", params: [userAccount, "latest"]})) as string | undefined;
      console.log('balance',balance)
      if(balance != undefined) {
        setAccountBalance(balance)
      }
    } catch (error) {
      console.error(error);
      const walletError: WalletError = error as WalletError
      setError(`Code: ${walletError.code} \nError Message: ${walletError.message}`)
    }
    finally {
      setIsLoading(false)
    }
  }


  // Display detected providers as connect buttons.
  return(
    <>
      <h2>Wallets Detected:</h2>
      {providers.length > 0 ? providers.map((provider: EIP6963ProviderDetail) => (
          <button className="flex items-center border-2 border-black cursor-pointer" key={provider.info.uuid} onClick={() => handleConnect(provider)}>
            <img src={provider.info.icon} alt={provider.info.name} />
            <div>{provider.info.name}</div>
          </button>
        ))
      :
      <div>
        No Announced Wallet Providers
      </div> 
      } 
      <>
        <h2>{userAccount ? "" : "No "}Wallet Selected</h2>
        {userAccount &&
        <div>
          <div className="flex items-center border-2 w-fit">
            <img src={selectedWallet?.info.icon} alt={selectedWallet?.info.name} />
            <div>{selectedWallet?.info.name}</div>
          </div>
          <div>{formatAddress(userAccount)}</div>
          <div className="flex items-center gap-5">
            <p>Balance: {isLoading ? 'LOADING' : formatBalance(accountBalance)}</p>
            <button className="border-2 border-black cursor-pointer" onClick={()=> checkAccountBalance(userAccount, providers[0])}>
              Check Balance
            </button>
          </div>
        </div>
      }
      </>
      <>
        {isError &&
          <div onClick={clearError}>
            <strong>Error:</strong> {errorMessage}
          </div>
        }
      </>
    </>
  )
}
