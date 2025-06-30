/* eslint-disable @next/next/no-img-element */
import { useState } from "react"
import { useSyncProviders } from "../hooks/useSyncProviders";
import { formatAddress } from "../utils/formatAddress";

export default function WalletProviders() {

  const [selectedWallet, setSelectedWallet] = useState<EIP6963ProviderDetail>();
  const [userAccount, setUserAccount] = useState<string>("");
  const providers = useSyncProviders();

   // Connect to the selected provider using eth_requestAccounts.
  const handleConnect = async (providerWithInfo: EIP6963ProviderDetail) => {
    const accounts: string[] | undefined = (await providerWithInfo.provider.request({method: "eth_requestAccounts" }).catch(e => alert(e.message))) as string[] | undefined;
    if(accounts?.[0] != undefined) {
      setSelectedWallet(providerWithInfo);
      setUserAccount(accounts[0])
    }
  }

  // Display detected providers as connect buttons.
  return(
    <>
      <h2>Wallets Detected:</h2>
      <div>
        {
          providers.length > 0 ? providers.map((provider: EIP6963ProviderDetail) => (
            <button className="flex items-center border-2 border-black cursor-pointer" key={provider.info.uuid} onClick={() => handleConnect(provider)}>
              <img src={provider.info.icon} alt={provider.info.name} />
              <div>Connect to {provider.info.name}</div>
            </button>
          )) :
          <div>
            No Announced Wallet Providers
          </div>
        }
      </div>
      <h2>{userAccount ? "" : "No "}Wallet Selected</h2>
      {userAccount && 
      <div>
          <div>
            <img src={selectedWallet?.info.icon} alt={selectedWallet?.info.name} />
            <div>{selectedWallet?.info.name}</div>
            <div>({formatAddress(userAccount)})</div>
          </div>
        </div>}
    </>
  )
}