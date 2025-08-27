import { useState } from 'react';
import { ethers } from 'ethers';

export const MerchantSetup = ({ signer, contractAddress, contractABI, currentMerchant, onMerchantUpdate }) => {
  const [wallet, setWallet] = useState('');
  const [pref, setPref] = useState('crypto');
  const [showAddressInput, setShowAddressInput] = useState(false);

  const setupMerchant = async () => {
    if (!signer) return alert('Connect wallet');
    
    if (!wallet || !ethers.isAddress(wallet)) {
      alert('Please enter a valid wallet address');
      return;
    }
    
    try {
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      await contract.setMerchant(wallet, pref);
      
      // Update the merchant address in the parent component for this session
      onMerchantUpdate(wallet);
      
      alert(`Merchant setup complete! Merchant address updated to: ${wallet}`);
      setShowAddressInput(false);
      setWallet('');
    } catch (error) {
      alert('Setup failed: ' + error.message);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Merchant Setup</h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">Current Merchant Address:</p>
        <p className="font-mono text-sm bg-gray-100 p-2 rounded border">
          {currentMerchant}
        </p>
      </div>
      
      {!showAddressInput ? (
        <button 
          onClick={() => setShowAddressInput(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          Set Merchant Address
        </button>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Merchant Wallet Address
            </label>
            <input
              type="text"
              placeholder="Enter wallet address (0x...)"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Preference
            </label>
            <select 
              value={pref} 
              onChange={(e) => setPref(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="crypto">Crypto (USDT)</option>
              <option value="fiat">Fiat</option>
            </select>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={setupMerchant}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Update Merchant
            </button>
            <button 
              onClick={() => {
                setShowAddressInput(false);
                setWallet('');
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
