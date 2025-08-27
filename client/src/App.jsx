import { useState } from 'react';
import { ethers } from 'ethers';
import { WalletConnect } from './WalletConnect';
import { MerchantSetup } from './MerchantSetup';

const dummyProducts = [
  { id: 1, name: 'T-Shirt', price: 50 },
  { id: 2, name: 'Mug', price: 20 },
];

function App() {
  const [cart, setCart] = useState([]);
  const [signer, setSigner] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isClaimingFaucet, setIsClaimingFaucet] = useState(false);
  const [usdtBalance, setUsdtBalance] = useState('0');

  // Hardcoded addresses for demo (Kairos testnet)
  const [merchant, setMerchant] = useState('0x16c0fE65ec9e622ba48a2623b2Dffe8ECF59f6F4'); // Demo merchant address - can be updated
  const usdtAddress = '0xc1AcB79cCc976B70A7b057D689173823c61D4eD6'; // Kairos USDT address
  const contractAddress = '0x5A7890D210DC7C61900c11B460D1346f483A6a3c'; // Deployed contract address (placeholder)
  
  // Real payment contract ABI
  const contractABI = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_usdt",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "merchant",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "pref",
          "type": "string"
        }
      ],
      "name": "PaymentProcessed",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "merchantPrefs",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "merchantWallets",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "merchant",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "pay",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "wallet",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "pref",
          "type": "string"
        }
      ],
      "name": "setMerchant",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "usdt",
      "outputs": [
        {
          "internalType": "contract IERC20",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];

  // Standard ERC-20 ABI for USDT
  // Complete USDT contract ABI
  const usdtABI = [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "spender",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "allowance",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "needed",
          "type": "uint256"
        }
      ],
      "name": "ERC20InsufficientAllowance",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "sender",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "balance",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "needed",
          "type": "uint256"
        }
      ],
      "name": "ERC20InsufficientBalance",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "approver",
          "type": "address"
        }
      ],
      "name": "ERC20InvalidApprover",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "receiver",
          "type": "address"
        }
      ],
      "name": "ERC20InvalidReceiver",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "sender",
          "type": "address"
        }
      ],
      "name": "ERC20InvalidSender",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "spender",
          "type": "address"
        }
      ],
      "name": "ERC20InvalidSpender",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "spender",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "Approval",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "Transfer",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "spender",
          "type": "address"
        }
      ],
      "name": "allowance",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "spender",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "approve",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "claimFaucet",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "decimals",
      "outputs": [
        {
          "internalType": "uint8",
          "name": "",
          "type": "uint8"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "lastClaim",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "mint",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "name",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "symbol",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalSupply",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "transfer",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "transferFrom",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

  const addToCart = (product) => {
    setCart([...cart, product]);
  };

    // Function to fetch USDT balance
  const fetchUsdtBalance = async (userSigner) => {
    try {
      console.log('Fetching USDT balance...');
      console.log('USDT Contract Address:', usdtAddress);
      
      const usdtContract = new ethers.Contract(usdtAddress, usdtABI, userSigner);
      const userAddress = await userSigner.getAddress();
      
      console.log('User Address:', userAddress);
      console.log('Calling balanceOf...');
      
      // First check if the contract exists by trying to get the code
      const provider = userSigner.provider;
      const code = await provider.getCode(usdtAddress);
      
      if (code === '0x') {
        console.error('USDT contract not found at address:', usdtAddress);
        setUsdtBalance('Contract not found');
        return;
      }
      
      const balance = await usdtContract.balanceOf(userAddress);
      console.log('Raw balance:', balance.toString());
      
      // Divide by 10^12 as requested by user
      const balanceFormatted = (Number(balance) / Math.pow(10, 12)).toString();
      console.log('Formatted balance:', balanceFormatted);
      
      setUsdtBalance(balanceFormatted);
    } catch (error) {
      console.error('Error fetching USDT balance:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        reason: error.reason
      });
      setUsdtBalance('Error');
    }
  };

  // Faucet function to claim USDT tokens
  const claimFaucet = async () => {
    if (!signer) {
      alert('Please connect your wallet first');
      return;
    }

    setIsClaimingFaucet(true);
    
    try {
      console.log('Claiming USDT from faucet...');
      
      // Create USDT contract instance
      const usdtContract = new ethers.Contract(usdtAddress, usdtABI, signer);
      
      // Check if user can claim (check lastClaim time)
      const userAddress = await signer.getAddress();
      try {
        const lastClaimTime = await usdtContract.lastClaim(userAddress);
        const currentTime = Math.floor(Date.now() / 1000);
        const timeSinceLastClaim = currentTime - Number(lastClaimTime);
        const oneHour = 3600; // 1 hour in seconds
        
        if (timeSinceLastClaim < oneHour) {
          const remainingTime = Math.ceil((oneHour - timeSinceLastClaim) / 60);
          alert(`You can claim again in ${remainingTime} minutes`);
          return;
        }
      } catch (error) {
        console.log('Could not check last claim time, proceeding with claim...');
      }
      
      // Call the claimFaucet function
      console.log('Calling claimFaucet function...');
      const claimTx = await usdtContract.claimFaucet();
      
      console.log('Transaction submitted:', claimTx.hash);
      alert(`Faucet claim submitted! Transaction: ${claimTx.hash}`);
      
      // Wait for confirmation
      const receipt = await claimTx.wait();
      console.log('Faucet claim confirmed:', receipt);
      
      alert('Faucet claim successful! You should receive USDT tokens shortly.');
      
      // Refresh USDT balance after successful claim
      await fetchUsdtBalance(signer);
      
    } catch (error) {
      console.error('Faucet claim failed:', error);
      
      if (error.code === 'INSUFFICIENT_FUNDS') {
        alert('Insufficient KAIA for transaction fees');
      } else if (error.code === 'USER_REJECTED') {
        alert('Transaction was rejected by user');
      } else if (error.message.includes('Too early')) {
        alert('You need to wait before claiming again from the faucet');
      } else {
        alert(`Faucet claim failed: ${error.message}`);
      }
    } finally {
      setIsClaimingFaucet(false);
    }
  };

  const checkout = async () => {
    if (!signer) {
      alert('Please connect your wallet first');
      return;
    }

    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    setIsProcessing(true);
    
    try {
      const total = cart.reduce((sum, p) => sum + p.price, 0);
      console.log(`Processing payment of ${total} USDT to merchant: ${merchant}`);

      // Step 1: Create USDT contract instance
      const usdtContract = new ethers.Contract(usdtAddress, usdtABI, signer);
      
      // Step 2: Check user's USDT balance
      const userAddress = await signer.getAddress();
      const balance = await usdtContract.balanceOf(userAddress);
      // Use same calculation as fetchUsdtBalance (divide by 10^12)
      const balanceFormatted = (Number(balance) / Math.pow(10, 12));
      
      console.log(`User USDT balance: ${(balanceFormatted/1000000)} USDT`);
      
      if (parseFloat(balanceFormatted) < total) {
        alert(`Insufficient USDT balance. You have ${balanceFormatted} USDT but need ${total} USDT`);
        return;
      }

      // Step 3: For demo purposes, we'll simulate a direct USDT transfer to merchant
      // In production, you'd use a smart contract for escrow/payment processing
      console.log('Initiating USDT transfer...');
      
      const amountInWei = ethers.parseUnits(total.toString()); // Use 18 decimals as requested
      const transferTx = await usdtContract.transfer(merchant, amountInWei);
      
      console.log('Transaction sent:', transferTx.hash);
      alert('Payment transaction submitted! Waiting for confirmation...');
      
      // Wait for transaction confirmation
      const receipt = await transferTx.wait();
      console.log('Transaction confirmed:', receipt);
      
      // Payment successful
      alert(`Payment successful! ${total} USDT transferred to merchant.\nTransaction: ${transferTx.hash}`);
      setCart([]); // Clear cart
      
      // Refresh USDT balance after successful payment
      await fetchUsdtBalance(signer);
      
    } catch (error) {
      console.error('Payment failed:', error);
      if (error.code === 'INSUFFICIENT_FUNDS') {
        alert('Insufficient KAIA for transaction fees');
      } else if (error.code === 'USER_REJECTED') {
        alert('Transaction was rejected by user');
      } else {
        alert(`Payment failed: ${error.message}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Alternative checkout using smart contract (when you have the contract deployed)
  const checkoutWithContract = async () => {
    if (!signer) {
      alert('Please connect your wallet first');
      return;
    }

    setIsProcessing(true);
    
    try {
      const total = cart.reduce((sum, p) => sum + p.price, 0);
      
      // Step 1: Approve contract to spend USDT
      const usdtContract = new ethers.Contract(usdtAddress, usdtABI, signer);
      const amountInWei = ethers.parseUnits(total.toString()); // Use 18 decimals as requested
      
      console.log('Approving contract to spend USDT...');
      const approveTx = await usdtContract.approve(contractAddress, amountInWei);
      await approveTx.wait();
      
      // Step 2: Call payment contract
      const paymentContract = new ethers.Contract(contractAddress, contractABI, signer);
      console.log('Processing payment through contract...');
      const payTx = await paymentContract.pay(merchant, amountInWei);
      await payTx.wait();
      
      alert('Payment successful through smart contract!');
      setCart([]);
      
      // Refresh USDT balance after successful payment
      await fetchUsdtBalance(signer);
      
    } catch (error) {
      console.error('Contract payment failed:', error);
      alert(`Payment failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle wallet connection and fetch USDT balance
  const handleWalletConnect = async (newSigner) => {
    setSigner(newSigner);
    if (newSigner) {
      await fetchUsdtBalance(newSigner);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Wallet Connection */}
      <div className="mb-8">
        <WalletConnect onConnect={handleWalletConnect} usdtBalance={usdtBalance} />
      </div>

      {/* Faucet Section */}
      {signer && (
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Testnet Faucet</h2>
                <p className="text-gray-600">
                  Need USDT for testing? Claim free testnet tokens from our faucet!
                </p>
              </div>
            </div>
            <button 
              onClick={claimFaucet}
              disabled={isClaimingFaucet}
              className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-6 rounded-md transition-colors"
            >
              {isClaimingFaucet ? 'Claiming Tokens...' : 'Claim 1000 USDT'}
            </button>
          </div>
        </div>
      )}

      {/* Merchant Setup */}
      <div className="mb-8">
        <MerchantSetup 
          signer={signer} 
          contractAddress={contractAddress} 
          contractABI={contractABI}
          currentMerchant={merchant}
          onMerchantUpdate={setMerchant}
        />
      </div>

      {/* App Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">ShopNow</h1>
        <p className="text-gray-600">Shop with USDT on Kairos testnet</p>
      </div>

      {/* Products Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dummyProducts.map(p => (
            <div key={p.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{p.name}</h3>
                  <p className="text-xl font-bold text-blue-600">{p.price} USDT</p>
                </div>
                <button 
                  onClick={() => addToCart(p)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shopping Cart */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Shopping Cart</h2>
        
        {cart.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Your cart is empty</p>
        ) : (
          <>
            {/* Cart Items */}
            <div className="space-y-3 mb-6">
              {cart.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-900">{item.name}</span>
                  <span className="font-medium text-gray-900">{item.price} USDT</span>
                </div>
              ))}
            </div>
            
            {/* Cart Total */}
            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total:</span>
                <span className="text-blue-600">{cart.reduce((sum, p) => sum + p.price, 0)} USDT</span>
              </div>
            </div>
            
            {/* Checkout Buttons */}
            <div className="space-y-3">
              <button 
                onClick={checkout}
                disabled={!signer || isProcessing}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-md transition-colors"
              >
                {isProcessing ? 'Processing Payment...' : 'Checkout with Direct Transfer'}
              </button>
            
              
              {!signer && (
                <p className="text-center text-sm text-gray-500 mt-2">
                  Please connect your wallet to checkout
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
