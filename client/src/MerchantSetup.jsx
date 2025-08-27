import { useState } from 'react';
import { ethers } from 'ethers';

export const MerchantSetup = ({ signer, contractAddress, contractABI }) => {
  const [wallet, setWallet] = useState('');
  const [pref, setPref] = useState('crypto');

  const setupMerchant = async () => {
    if (!signer) return alert('Connect wallet');
    try {
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      await contract.setMerchant(wallet, pref);
      alert('Merchant setup complete!');
    } catch (error) {
      alert('Setup failed: ' + error.message);
    }
  };

  return (
    <div style={{ margin: '20px 0' }}>
      <h3>Merchant Setup</h3>
      <input
        type="text"
        placeholder="Wallet Address"
        value={wallet}
        onChange={(e) => setWallet(e.target.value)}
        style={{ marginRight: '10px' }}
      />
      <select value={pref} onChange={(e) => setPref(e.target.value)}>
        <option value="crypto">Crypto (USDT)</option>
        <option value="fiat">Fiat</option>
      </select>
      <button onClick={setupMerchant} style={{ marginLeft: '10px' }}>
        Set Merchant
      </button>
    </div>
  );
};
