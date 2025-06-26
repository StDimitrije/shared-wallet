'use client'
import { ethers } from "ethers";
import {  useEffect, useState } from "react";
import { loadNetworkData } from "../utils/loadNetworkData";
import { Account } from "../types/account";



export default function Dashboard() {
  const [account, setAccount] = useState<Account>({
    accountAddress: undefined,
    isConnected: false,
    network: undefined,
    balance: undefined
  });

  useEffect(()=>{
    if(typeof window.ethereum !== 'undefined') {
      const provider = new ethers.BrowserProvider(window.ethereum);

      provider.send('eth_accounts', []).then(async (accounts: string[]) => {
        if (accounts.length > 0) {
          const currentAccount = accounts[0];
          setAccount((prevState) => ({
            ...prevState,
            accountAddress: currentAccount,
            isConnected: true
          }));
          await loadNetworkData(provider, currentAccount, setAccount);
        }
      });

      window.ethereum.on('accountsChanged', async (accounts: string[]) => {
        const newAccount = accounts[0] || undefined;
        setAccount(prevState => ({
          ...prevState,
          accountAddress: newAccount,
          isConnected: accounts.length > 0
        }));
        if (newAccount) await loadNetworkData(provider, newAccount, setAccount);
      });
    }
  }, [])

  

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask!');
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const selectedAccount = accounts[0];
      setAccount(prevState => ({
        ...prevState,
        accountAddress: selectedAccount,
        isConnected: true
      }))
      await loadNetworkData(provider, selectedAccount, setAccount);
    } catch (err) {
      console.error('Connection error:', err);
    }
  };

  return(
    <div>
      <h2 className="text-center">Dashboard</h2>
      <div className="p-4 border rounded-xl max-w-md mx-auto mt-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Connect to MetaMask</h1>
        {account.isConnected ? (
          <div className="space-y-2">
            <p className="text-green-600">Connected: {account.accountAddress}</p>
            <p className="text-sm">Network: {account.network}</p>
            <p className="text-sm">Balance: {account.balance} ETH</p>
          </div>
        ) : (
          <button className="button" onClick={connectWallet}>Connect Wallet</button>
        )}
      </div>
    </div>
  )
}