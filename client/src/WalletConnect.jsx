import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import liff from '@line/liff';

export const WalletConnect = ({ onConnect, usdtBalance }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isInLiffApp, setIsInLiffApp] = useState(false);

  const KAIROS_CHAIN_ID = '0x3e9'; // 1001 in decimal
  const KAIROS_RPC = 'https://public-en-kairos.node.kaia.io';

  useEffect(() => {
    // Check if we're in LIFF app
    try {
      setIsInLiffApp(liff.isInClient && liff.isInClient());
    } catch (error) {
      setIsInLiffApp(false);
    }
    
    checkConnection();
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      disconnect();
    } else {
      setAccount(accounts[0]);
      fetchBalance(accounts[0]);
    }
  };

  const handleChainChanged = () => {
    checkNetwork();
    if (isConnected) {
      fetchBalance(account);
    }
  };

  const checkConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
          await checkNetwork();
          await fetchBalance(accounts[0]);
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          onConnect(signer);
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    }
  };

  const checkNetwork = async () => {
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      setIsCorrectNetwork(chainId === KAIROS_CHAIN_ID);
    } catch (error) {
      console.error('Error checking network:', error);
      setIsCorrectNetwork(false);
    }
  };

  const fetchBalance = async (address) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const balanceWei = await provider.getBalance(address);
      const balanceKAIA = ethers.formatEther(balanceWei);
      setBalance(balanceKAIA);
      console.log('Balance fetched:', balanceKAIA, 'KAIA');
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance('0');
    }
  };

  const connectWallet = async () => {
    setLoading(true);
    try {
      let provider;
      let signer;

      if (isInLiffApp) {
        // LINE in-app browser with LIFF
        if (window.klaytn) {
          // Use Kaia wallet (Klaytn/KAIA compatible)
          provider = new ethers.BrowserProvider(window.klaytn);
        } else if (window.ethereum) {
          // Fallback to MetaMask in LINE browser
          provider = new ethers.BrowserProvider(window.ethereum);
          await window.ethereum.request({ method: 'eth_requestAccounts' });
        } else {
          alert('Please install a compatible wallet in LINE app!');
          return;
        }
      } else {
        // Regular browser - use MetaMask
        if (!window.ethereum) {
          alert('Please install MetaMask!');
          return;
        }
        provider = new ethers.BrowserProvider(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      }

      signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      setAccount(address);
      setIsConnected(true);
      
      // Check network and fetch balance
      await checkNetwork();
      await fetchBalance(address);
      
      // Pass signer to parent component
      onConnect(signer);
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const addKairosNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: KAIROS_CHAIN_ID,
          chainName: 'Kairos testnet',
          nativeCurrency: {
            name: 'KAIA',
            symbol: 'KAIA',
            decimals: 18,
          },
          rpcUrls: [KAIROS_RPC],
          blockExplorerUrls: ['https://kairos.kaiascan.io/'],
        }],
      });
    } catch (error) {
      console.error('Error adding network:', error);
      alert('Failed to add Kairos network');
    }
  };

  const switchToKairos = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: KAIROS_CHAIN_ID }],
      });
    } catch (error) {
      if (error.code === 4902) {
        // Network not added yet, add it
        await addKairosNetwork();
      } else {
        console.error('Error switching network:', error);
        alert('Failed to switch to Kairos network');
      }
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setAccount('');
    setBalance('');
    setIsCorrectNetwork(false);
    onConnect(null);
  };

  const refreshBalance = () => {
    if (account) {
      fetchBalance(account);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Connect Your Wallet
          </h3>
          <p className="text-gray-600 mb-4">
            {isInLiffApp 
              ? "Connect your wallet in LINE app to start shopping" 
              : "Connect MetaMask to Kairos testnet to start shopping"
            }
          </p>
          <div className="space-y-3">
            <button
              onClick={connectWallet}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {loading ? 'Connecting...' : 
               isInLiffApp ? 'Connect Wallet' : 'Connect MetaMask'}
            </button>
            {!isInLiffApp && (
              <button
                onClick={addKairosNetwork}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Add Kairos Network
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-3">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <h3 className="text-lg font-semibold text-gray-900">
              Wallet Connected
            </h3>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Address:</span>
              <span className="font-mono text-gray-900">
                {account.slice(0, 6)}...{account.slice(-4)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Network:</span>
              <span className={`font-medium ${isCorrectNetwork ? 'text-green-600' : 'text-red-600'}`}>
                {isCorrectNetwork ? 'Kairos Testnet' : 'Wrong Network'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">KAIA Balance:</span>
              <span className="font-semibold text-gray-900">
                {parseFloat(balance).toFixed(4)} KAIA
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">USDT Balance:</span>
              <span className="font-semibold text-green-600">
                {parseFloat((usdtBalance/1000000) || '0').toFixed(2)} USDT
              </span>
            </div>
          </div>
        </div>
      </div>

      {!isCorrectNetwork && !isInLiffApp && (
        <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md">
          <p className="text-yellow-800 text-sm mb-2">
            Please switch to Kairos testnet to continue
          </p>
          <button
            onClick={switchToKairos}
            className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium py-1 px-3 rounded transition-colors"
          >
            Switch to Kairos
          </button>
        </div>
      )}

      {!isCorrectNetwork && isInLiffApp && (
        <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-md">
          <p className="text-blue-800 text-sm">
            Please ensure your wallet is connected to Kairos testnet in LINE app
          </p>
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <button
          onClick={refreshBalance}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded transition-colors"
        >
          Refresh
        </button>
        <button
          onClick={disconnect}
          className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-3 rounded transition-colors"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
};