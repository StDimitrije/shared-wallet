/* eslint-disable @next/next/no-img-element */
import { useWalletProvider } from "../hooks/useWalletProvider"

export default function WalletList() {
  const {wallets, connectWallet} = useWalletProvider();

  return(
    <>
    <h2>Wallets Detected:</h2>
    {/* Returns an array of the wallet keys (rdns values). */}
    {Object.keys(wallets).length > 0 ? (
      // returns an array of the wallet objects. It is used to map and render.
      Object.values(wallets).map((provider: EIP6963ProviderDetail) => (
        // wallet.info.rdns is used as the key to ensure that each wallet button is uniquely identified
        <button
          className="flex items-center gap-2 border-2 px-2.5 py-1 cursor-pointer"
          key={provider.info.uuid}
          onClick={() => connectWallet(provider.info.rdns)}
        >
          <img src={provider.info.icon} alt={provider.info.name} />
          <div>{provider.info.name}</div>
        </button>
      ))
    ) : (
      <div>There are no Announced Providers</div>
    )}
    </>
  )
}