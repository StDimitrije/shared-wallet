/* eslint-disable @next/next/no-img-element */
import { useWalletProvider } from "../hooks/useWalletProvider"
import { formatAddress } from "../utils/formatAddress";

export default function SelectedWallet() {

  const {selectedWallet, selectedAccount, disconnectWallet} = useWalletProvider();
  return(
    <>
      <h2>
        {selectedAccount ? "" : "No "}Wallet Selected
      </h2>
      {selectedAccount && (
        <>
          {selectedWallet && 
            <div>
              <div className="flex items-center gap-2">
                <img
                  src={selectedWallet.info.icon}
                  alt={selectedWallet.info.name}
                />
                <p>{selectedWallet.info.name}</p>
              </div>
              <div>({formatAddress(selectedAccount)})</div>
              <div>
                <strong>uuid:</strong> {selectedWallet.info.uuid}
              </div>
              <div>
                <strong>rdns:</strong> {selectedWallet.info.rdns}
              </div>
          </div>
        }
          <button className="bg-red-500 text-white px-2.5 py-1" onClick={disconnectWallet}>Disconnect Wallet</button>
        </>
      )}


    </>

  )
}