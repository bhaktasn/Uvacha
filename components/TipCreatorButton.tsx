'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
  useSwitchChain,
  useReadContract,
} from 'wagmi';
import { parseUnits, formatUnits, type Address } from 'viem';
import { base, polygon, mainnet } from 'wagmi/chains';

// Supported chains configuration
const SUPPORTED_CHAINS = [
  { id: base.id, name: 'Base', color: '#0052FF' },
  { id: polygon.id, name: 'Polygon', color: '#8247E5' },
  { id: mainnet.id, name: 'Ethereum', color: '#627EEA' },
] as const;

// Default to Base
const DEFAULT_CHAIN_ID = base.id;

// USDC contract addresses per chain
const USDC_ADDRESSES: Record<number, Address> = {
  [base.id]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  [polygon.id]: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // USDC (native) on Polygon
  [mainnet.id]: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
};

// USDC has 6 decimals on all chains
const USDC_DECIMALS = 6;
const TIP_AMOUNT_CENTS = 50;
const TIP_AMOUNT_USDC = TIP_AMOUNT_CENTS / 100;

// ERC20 ABI (minimal)
const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

interface TipCreatorButtonProps {
  creatorAddress: string;
  creatorUsername?: string | null;
}

type TipState = 'idle' | 'switching' | 'confirming' | 'pending' | 'success' | 'error';

function parseTransactionError(error: Error): string {
  const message = error.message.toLowerCase();
  
  if (message.includes('transfer amount exceeds balance') || message.includes('insufficient funds') || message.includes('exceeds balance')) {
    return 'Insufficient USDC balance';
  }
  if (message.includes('user rejected') || message.includes('user denied') || message.includes('rejected the request') || message.includes('cancelled')) {
    return 'Transaction cancelled';
  }
  if (message.includes('allowance') || message.includes('approved')) {
    return 'Token approval required';
  }
  if (message.includes('network') || message.includes('disconnected') || message.includes('timeout')) {
    return 'Network error - please try again';
  }
  if (message.includes('gas') && message.includes('estimation')) {
    return 'Transaction would fail - check balance';
  }
  if (message.includes('reverted') || message.includes('revert')) {
    return 'Transaction failed';
  }
  return 'Something went wrong';
}

export function TipCreatorButton({ creatorAddress }: TipCreatorButtonProps) {
  const { isConnected, address } = useAccount();
  const currentChainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  
  const [selectedChainId, setSelectedChainId] = useState<number>(DEFAULT_CHAIN_ID);
  const [tipState, setTipState] = useState<TipState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { writeContract, data: hash, isPending: isWritePending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Get chain info
  const selectedChain = SUPPORTED_CHAINS.find(c => c.id === selectedChainId) || SUPPORTED_CHAINS[0];
  const usdcAddress = USDC_ADDRESSES[selectedChainId];
  const isOnSelectedChain = currentChainId === selectedChainId;

  // Read USDC balance on selected chain
  const { data: balanceData, refetch: refetchBalance } = useReadContract({
    address: usdcAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: selectedChainId,
    query: {
      enabled: Boolean(isConnected && address && usdcAddress),
    },
  });

  const usdcBalance = balanceData ? Number(formatUnits(balanceData, USDC_DECIMALS)) : 0;
  const hasEnoughBalance = usdcBalance >= TIP_AMOUNT_USDC;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update state when transaction confirms
  useEffect(() => {
    if (isSuccess && tipState === 'pending') {
      setTipState('success');
      refetchBalance();
    }
  }, [isSuccess, tipState, refetchBalance]);

  const handleSelectChain = useCallback((chainId: number) => {
    setSelectedChainId(chainId);
    setIsDropdownOpen(false);
    setTipState('idle');
    setErrorMessage(null);
  }, []);

  const handleTip = useCallback(async () => {
    if (!isConnected || !usdcAddress) return;

    // If not on selected chain, switch first
    if (!isOnSelectedChain) {
      setTipState('switching');
      try {
        await switchChain({ chainId: selectedChainId });
        // After switch, the component will re-render and user can click again
        setTipState('idle');
      } catch (error) {
        console.error('Chain switch failed:', error);
        setTipState('error');
        setErrorMessage('Failed to switch network');
      }
      return;
    }

    // Pre-check balance
    if (!hasEnoughBalance) {
      setTipState('error');
      setErrorMessage(`Need ${TIP_AMOUNT_USDC.toFixed(2)} USDC (have ${usdcBalance.toFixed(2)})`);
      return;
    }

    setTipState('confirming');
    setErrorMessage(null);

    try {
      const amount = parseUnits(TIP_AMOUNT_USDC.toString(), USDC_DECIMALS);
      
      writeContract({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [creatorAddress as Address, amount],
      }, {
        onSuccess: () => {
          setTipState('pending');
        },
        onError: (error) => {
          console.error('Tip transaction failed:', error);
          setTipState('error');
          const parsed = parseTransactionError(error);
          setErrorMessage(parsed === 'Insufficient USDC balance' 
            ? `Insufficient USDC on ${selectedChain.name}` 
            : parsed);
        },
      });
    } catch (error) {
      console.error('Tip error:', error);
      setTipState('error');
      setErrorMessage(error instanceof Error ? parseTransactionError(error) : 'Failed to send tip');
    }
  }, [isConnected, usdcAddress, isOnSelectedChain, switchChain, selectedChainId, hasEnoughBalance, usdcBalance, writeContract, creatorAddress, selectedChain.name]);

  const resetTip = useCallback(() => {
    setTipState('idle');
    setErrorMessage(null);
    reset();
  }, [reset]);

  // Not connected - show connect button
  if (!isConnected) {
    return (
      <ConnectButton.Custom>
        {({ openConnectModal }) => (
          <button
            onClick={openConnectModal}
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-[#f5d67b]/30 bg-gradient-to-r from-[#f5d67b]/10 to-[#f5d67b]/5 px-5 py-2.5 text-sm font-medium text-[#f5d67b] transition-all duration-300 hover:border-[#f5d67b]/60 hover:from-[#f5d67b]/20 hover:to-[#f5d67b]/10 hover:shadow-[0_0_20px_rgba(245,214,123,0.2)]"
          >
            <TipIcon className="h-4 w-4" />
            <span>Tip $0.50</span>
          </button>
        )}
      </ConnectButton.Custom>
    );
  }

  // Success state
  if (tipState === 'success') {
    return (
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-5 py-2.5 text-sm font-medium text-emerald-400">
          <CheckIcon className="h-4 w-4" />
          <span>Tip sent!</span>
        </div>
        <button onClick={resetTip} className="text-xs text-white/50 hover:text-white/70 hover:underline underline-offset-2">
          Tip again
        </button>
      </div>
    );
  }

  // Error state
  if (tipState === 'error') {
    return (
      <div className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-400">
          <XIcon className="h-4 w-4" />
          <span>{errorMessage || 'Failed'}</span>
        </div>
        <button onClick={resetTip} className="text-xs text-white/50 hover:text-white/70 hover:underline underline-offset-2">
          Try again
        </button>
      </div>
    );
  }

  // Loading states
  if (tipState === 'switching' || isSwitchingChain) {
    return (
      <button disabled className="inline-flex items-center gap-2 rounded-full border border-[#f5d67b]/20 bg-[#f5d67b]/5 px-5 py-2.5 text-sm font-medium text-[#f5d67b]/70">
        <LoadingSpinner className="h-4 w-4 animate-spin" />
        <span>Switching to {selectedChain.name}...</span>
      </button>
    );
  }

  if (tipState === 'confirming' || tipState === 'pending' || isWritePending || isConfirming) {
    return (
      <button disabled className="inline-flex items-center gap-2 rounded-full border border-[#f5d67b]/20 bg-[#f5d67b]/5 px-5 py-2.5 text-sm font-medium text-[#f5d67b]/70">
        <LoadingSpinner className="h-4 w-4 animate-spin" />
        <span>{isConfirming ? 'Confirming...' : 'Confirm in wallet...'}</span>
      </button>
    );
  }

  // Default state - show tip button with chain selector
  return (
    <div className="space-y-3">
      {/* Chain selector dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="inline-flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 transition-all hover:border-white/20 hover:bg-white/10"
        >
          <div className="flex items-center gap-2">
            <span 
              className="h-2 w-2 rounded-full" 
              style={{ backgroundColor: selectedChain.color }}
            />
            <span>{selectedChain.name}</span>
            <span className="text-white/40">•</span>
            <span className={hasEnoughBalance ? 'text-emerald-400' : 'text-amber-400'}>
              {usdcBalance.toFixed(2)} USDC
            </span>
          </div>
          <ChevronDownIcon className={`h-4 w-4 text-white/50 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {isDropdownOpen && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a] shadow-xl">
            {SUPPORTED_CHAINS.map((chain) => (
              <ChainOption
                key={chain.id}
                chain={chain}
                isSelected={chain.id === selectedChainId}
                address={address}
                onSelect={() => handleSelectChain(chain.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tip button */}
      <button
        onClick={handleTip}
        disabled={!hasEnoughBalance}
        className={`group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
          hasEnoughBalance
            ? 'border border-[#f5d67b]/30 bg-gradient-to-r from-[#f5d67b]/10 to-[#f5d67b]/5 text-[#f5d67b] hover:border-[#f5d67b]/60 hover:from-[#f5d67b]/20 hover:to-[#f5d67b]/10 hover:shadow-[0_0_20px_rgba(245,214,123,0.2)]'
            : 'border border-white/10 bg-white/5 text-white/40 cursor-not-allowed'
        }`}
      >
        <TipIcon className="h-4 w-4" />
        <span>
          {!isOnSelectedChain 
            ? `Switch to ${selectedChain.name} & Tip $0.50`
            : hasEnoughBalance 
              ? 'Tip $0.50' 
              : `Need ${TIP_AMOUNT_USDC.toFixed(2)} USDC`
          }
        </span>
      </button>
    </div>
  );
}

// Chain option component with balance fetching
function ChainOption({ 
  chain, 
  isSelected, 
  address,
  onSelect 
}: { 
  chain: typeof SUPPORTED_CHAINS[number]; 
  isSelected: boolean;
  address: Address | undefined;
  onSelect: () => void;
}) {
  const usdcAddress = USDC_ADDRESSES[chain.id];
  
  const { data: balanceData } = useReadContract({
    address: usdcAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: chain.id,
    query: {
      enabled: Boolean(address && usdcAddress),
    },
  });

  const balance = balanceData ? Number(formatUnits(balanceData, USDC_DECIMALS)) : 0;
  const hasEnough = balance >= TIP_AMOUNT_USDC;

  return (
    <button
      onClick={onSelect}
      className={`flex w-full items-center justify-between px-3 py-2.5 text-sm transition-colors hover:bg-white/5 ${
        isSelected ? 'bg-white/5' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <span 
          className="h-2 w-2 rounded-full" 
          style={{ backgroundColor: chain.color }}
        />
        <span className="text-white/80">{chain.name}</span>
      </div>
      <span className={hasEnough ? 'text-emerald-400' : 'text-white/40'}>
        {balance.toFixed(2)} USDC
      </span>
    </button>
  );
}

// Icons
function TipIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 18V6" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
