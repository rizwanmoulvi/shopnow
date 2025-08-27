import { useState } from 'react';
import { ethers } from 'ethers';
import liff from '@line/liff';

export const WalletConnect = ({ onConnect }) => {
  const [account, setAccount] = useState(null);

  const connect = async () => {
    let provider;
    if (liff.isInClient()) { // LINE in-app
      // LINE built-in Kaia wallet (via LIFF Web3)
      provider = new ethers.providers.Web3Provider(window.klaytn); // Kaia-compatible
    } else { // Browser/MetaMask
      provider = new ethers.providers.Web3Provider(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    }
    const signer = provider.getSigner();
    const addr = await signer.getAddress();
    setAccount(addr);
    onConnect(signer);
  };

  return <button onClick={connect}>Connect Wallet</button>;
};