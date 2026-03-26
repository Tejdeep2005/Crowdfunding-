import React, { useContext, createContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

const StateContext = createContext();

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';
const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || 11155111);
const CHAIN_NAME = import.meta.env.VITE_CHAIN_NAME || 'Sepolia';
const RPC_URL = import.meta.env.VITE_RPC_URL || 'https://rpc.sepolia.org';
const BLOCK_EXPLORER_URL = import.meta.env.VITE_BLOCK_EXPLORER_URL || 'https://sepolia.etherscan.io';

const CONTRACT_ABI = [
  "function createCampaign(address _owner, string memory _title, string memory _description, uint256 _target, uint256 _deadline, string memory _image) public returns (uint256)",
  "function getCampaigns() public view returns (tuple(address owner, string title, string description, uint256 target, uint256 deadline, uint256 amountCollected, string image, address[] donators, uint256[] donations)[])",
  "function donateToCampaign(uint256 _id) public payable",
  "function getDonators(uint256 _id) view public returns (address[] memory, uint256[] memory)"
];

export const StateContextProvider = ({ children }) => {
  const [address, setAddress] = useState('');
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [walletType, setWalletType] = useState('');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  const getContractInstance = (web3Provider) => {
    if (!CONTRACT_ADDRESS) return null;
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, web3Provider.getSigner());
  };

  const checkNetwork = async (ethereum) => {
    const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
    const matches = Number.parseInt(chainIdHex, 16) === CHAIN_ID;
    setIsCorrectNetwork(matches);
    return matches;
  };

  const ensureNetwork = async (ethereum) => {
    const matches = await checkNetwork(ethereum);
    if (matches) return true;

    const chainIdHex = `0x${CHAIN_ID.toString(16)}`;

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
      setIsCorrectNetwork(true);
      return true;
    } catch (switchError) {
      if (switchError.code === 4902) {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: chainIdHex,
            chainName: CHAIN_NAME,
            nativeCurrency: {
              name: 'Ethereum',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: [RPC_URL],
            blockExplorerUrls: [BLOCK_EXPLORER_URL],
          }],
        });
        setIsCorrectNetwork(true);
        return true;
      }

      throw switchError;
    }
  };

  useEffect(() => {
    console.log('Checking for wallets...');
    console.log('window.ethereum exists:', !!window.ethereum);

    if (!window.ethereum) {
      console.log('No ethereum provider found');
      return undefined;
    }

    console.log('Ethereum providers found:', window.ethereum.providers?.length || 'single provider');

    const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(web3Provider);

    if (window.ethereum.isCoinbaseWallet) {
      console.log('Coinbase Wallet detected');
      setWalletType('Coinbase Wallet');
    } else if (window.ethereum.isMetaMask) {
      console.log('MetaMask detected');
      setWalletType('MetaMask');
    } else {
      console.log('Unknown wallet detected');
      setWalletType('Unknown Wallet');
    }

    window.ethereum.request({ method: 'eth_accounts' })
      .then(async (accounts) => {
        console.log('Existing accounts:', accounts);
        await checkNetwork(window.ethereum);

        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setContract(getContractInstance(web3Provider));
          console.log('Auto-connected wallet found');
        }
      })
      .catch((err) => console.log('Error checking accounts:', err));

    const handleChainChanged = () => window.location.reload();
    const handleAccountsChanged = (accounts) => setAddress(accounts[0] || '');

    window.ethereum.on?.('chainChanged', handleChainChanged);
    window.ethereum.on?.('accountsChanged', handleAccountsChanged);

    return () => {
      window.ethereum.removeListener?.('chainChanged', handleChainChanged);
      window.ethereum.removeListener?.('accountsChanged', handleAccountsChanged);
    };
  }, [walletType]);

  const connect = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install a Web3 wallet like Coinbase Wallet or MetaMask.');
        return;
      }

      console.log('Connecting to wallet...');

      let ethereum = window.ethereum;
      if (window.ethereum.providers?.length) {
        const coinbaseProvider = window.ethereum.providers.find((p) => p.isCoinbaseWallet);
        const metamaskProvider = window.ethereum.providers.find((p) => p.isMetaMask);
        ethereum = coinbaseProvider || metamaskProvider || window.ethereum.providers[0];
        console.log('Using provider:', ethereum.isCoinbaseWallet ? 'Coinbase' : ethereum.isMetaMask ? 'MetaMask' : 'Unknown');
      }

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      await ensureNetwork(ethereum);

      const web3Provider = new ethers.providers.Web3Provider(ethereum);
      setProvider(web3Provider);
      setAddress(accounts[0]);
      setContract(getContractInstance(web3Provider));

      if (ethereum.isCoinbaseWallet) {
        setWalletType('Coinbase Wallet');
      } else if (ethereum.isMetaMask) {
        setWalletType('MetaMask');
      } else {
        setWalletType('Web3 Wallet');
      }

      if (!CONTRACT_ADDRESS) {
        alert('Wallet connected, but VITE_CONTRACT_ADDRESS is missing. Add your deployed contract address in client/.env.');
        return;
      }

      alert(`Successfully connected!\nWallet: ${ethereum.isCoinbaseWallet ? 'Coinbase' : ethereum.isMetaMask ? 'MetaMask' : 'Web3'}\nNetwork: ${CHAIN_NAME}\nAccount: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`);
    } catch (error) {
      console.error('Connection failed:', error);
      if (error.code === 4001) {
        alert('Connection rejected by user');
      } else {
        alert('Failed to connect wallet: ' + error.message);
      }
    }
  };

  const createCampaign = async (form) => {
    try {
      if (!address) {
        alert('Please connect your wallet first.');
        return;
      }

      if (!contract || !isCorrectNetwork) {
        alert(`Contract not available. Make sure you are connected to ${CHAIN_NAME} and VITE_CONTRACT_ADDRESS is set.`);
        return;
      }

      const cleanTarget = form.target.toString().replace(/[^0-9.]/g, '');
      const contractWithSigner = contract.connect(provider.getSigner());
      const deadline = Math.floor(new Date(form.deadline).getTime() / 1000);

      const gasEstimate = await contractWithSigner.estimateGas.createCampaign(
        address,
        form.title,
        form.description,
        ethers.utils.parseEther(cleanTarget),
        deadline,
        form.image
      );

      const tx = await contractWithSigner.createCampaign(
        address,
        form.title,
        form.description,
        ethers.utils.parseEther(cleanTarget),
        deadline,
        form.image,
        { gasLimit: gasEstimate.mul(120).div(100) }
      );

      alert('Transaction sent! Hash: ' + tx.hash + '\nWaiting for confirmation...');
      await tx.wait();
      alert('Campaign created successfully!');
    } catch (error) {
      console.error('Campaign creation failed:', error);
      if (error.code === 4001) {
        alert('Transaction rejected by user');
      } else if (error.code === -32603) {
        alert(`Network error. Make sure you are connected to ${CHAIN_NAME} (Chain ID: ${CHAIN_ID}).`);
      } else {
        alert('Failed to create campaign: ' + (error.reason || error.message));
      }
    }
  };

  const getCampaigns = async () => {
    if (!contract) return [];

    try {
      const campaigns = await contract.getCampaigns();
      return campaigns.map((campaign, i) => ({
        owner: campaign.owner,
        title: campaign.title,
        description: campaign.description,
        target: ethers.utils.formatEther(campaign.target.toString()),
        deadline: campaign.deadline.toNumber(),
        amountCollected: ethers.utils.formatEther(campaign.amountCollected.toString()),
        image: campaign.image,
        pId: i
      }));
    } catch (error) {
      console.error('Failed to get campaigns:', error);
      return [];
    }
  };

  const getUserCampaigns = async () => {
    const allCampaigns = await getCampaigns();
    return allCampaigns.filter((campaign) => campaign.owner === address);
  };

  const donate = async (pId, amount) => {
    if (!contract) return null;

    try {
      const tx = await contract.donateToCampaign(pId, {
        value: ethers.utils.parseEther(amount)
      });
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Donation failed:', error);
      throw error;
    }
  };

  const getDonations = async (pId) => {
    if (!contract) return [];

    try {
      const donations = await contract.getDonators(pId);
      const numberOfDonations = donations[0].length;
      const parsedDonations = [];

      for (let i = 0; i < numberOfDonations; i++) {
        parsedDonations.push({
          donator: donations[0][i],
          donation: ethers.utils.formatEther(donations[1][i].toString())
        });
      }

      return parsedDonations;
    } catch (error) {
      console.error('Failed to get donations:', error);
      return [];
    }
  };

  const createCampaignDirect = async (form) => {
    try {
      if (!address) {
        alert('Please connect your wallet first.');
        return;
      }

      const cleanTarget = form.target.toString().replace(/[^0-9.]/g, '');
      const deadline = Math.floor(new Date(form.deadline).getTime() / 1000);
      const iface = new ethers.utils.Interface(CONTRACT_ABI);
      const data = iface.encodeFunctionData('createCampaign', [
        address,
        form.title,
        form.description,
        ethers.utils.parseEther(cleanTarget),
        deadline,
        form.image
      ]);

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: address,
          to: CONTRACT_ADDRESS,
          data,
          gas: '0x186A0',
          value: '0x0'
        }]
      });

      alert('Transaction submitted! Hash: ' + txHash + '\n\nCheck your wallet for confirmation.');

      setTimeout(async () => {
        try {
          const receipt = await provider.getTransactionReceipt(txHash);
          if (receipt && receipt.status === 1) {
            alert('Campaign created successfully!');
          }
        } catch (error) {
          console.log('Receipt check failed:', error);
        }
      }, 5000);
    } catch (error) {
      console.error('Direct campaign creation failed:', error);
      if (error.code === 4001) {
        alert('Transaction was rejected. Please try again.');
      } else if (error.code === -32603) {
        alert(`RPC Error. Make sure you are on the correct network (${CHAIN_NAME}).`);
      } else {
        alert('Error: ' + (error.message || 'Unknown error occurred'));
      }
    }
  };

  return (
    <StateContext.Provider
      value={{
        address,
        contract,
        provider,
        walletType,
        connect,
        createCampaign,
        createCampaignDirect,
        getCampaigns,
        getUserCampaigns,
        donate,
        getDonations
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext);
