import { ethers } from "ethers";
import { Dispatch, SetStateAction } from "react";
import { Account } from "../types/account";


export const loadNetworkData = async (provider: ethers.BrowserProvider, account: string, setAccount: Dispatch<SetStateAction<Account>>) => {
  try {
    const networkInfo = await provider.getNetwork();

    setAccount(prevState => ({
      ...prevState,
      network: networkInfo.name
    }))
  } catch (error) {
    console.error("provider.getNetwork error", error);
  }

  try {
    const balanceInWei = await provider.getBalance(account);
    setAccount(prevState => ({
      ...prevState,
      balance: ethers.formatEther(balanceInWei)
    }))

  } catch (error) {
    console.error("provider.getBalance error", error)
  }
}