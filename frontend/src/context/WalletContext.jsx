import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useAuth } from './AuthContext';
import { userAPI, authAPI } from '../services/api';

const WalletContext = createContext();

export const WalletContextProvider = ({ children }) => {
    const { user, isAuthenticated, updateUser } = useAuth();

    // Địa chỉ ví hoạt động hiện tại (ưu tiên ví MetaMask đang kết nối, fallback về ví đã liên kết)
    const [walletAddress, setWalletAddress] = useState(user?.walletAddress || '');
    const [walletBalance, setWalletBalance] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [isLinking, setIsLinking] = useState(false);

    // Lấy số dư ví ETH Sepolia
    const fetchBalance = useCallback(async (address) => {
        if (!address) {
            setWalletBalance('');
            return;
        }
        try {
            if (window.ethereum) {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const balanceBigInt = await provider.getBalance(address);
                const ethStr = ethers.formatEther(balanceBigInt);
                const ethNum = parseFloat(parseFloat(ethStr).toFixed(4));
                setWalletBalance(`${ethNum} ETH`);
            } else {
                try {
                    const rpcProvider = new ethers.JsonRpcProvider('https://ethereum-sepolia-rpc.publicnode.com');
                    const balanceBigInt = await rpcProvider.getBalance(address);
                    const ethStr = ethers.formatEther(balanceBigInt);
                    const ethNum = parseFloat(parseFloat(ethStr).toFixed(4));
                    setWalletBalance(`${ethNum} ETH`);
                } catch {
                    setWalletBalance('');
                }
            }
        } catch (err) {
            console.error('Lỗi lấy số dư ví WalletContext:', err);
        }
    }, []);

    // Khởi tạo và đồng bộ ví khi trạng thái đăng nhập hoặc tài khoản thay đổi
    const checkWallet = useCallback(async () => {
        if (!isAuthenticated) {
            setWalletAddress('');
            setWalletBalance('');
            return;
        }

        // 1. Kiểm tra ví MetaMask đang kết nối trên trình duyệt
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts && accounts[0]) {
                    setWalletAddress(accounts[0]);
                    await fetchBalance(accounts[0]);
                    return;
                }
            } catch (err) {
                console.error('Lỗi eth_accounts WalletContext:', err);
            }
        }

        // 2. Nếu MetaMask chưa cấp quyền kết nối, fallback về ví đã liên kết tài khoản trong DB
        if (user?.walletAddress) {
            setWalletAddress(user.walletAddress);
            await fetchBalance(user.walletAddress);
        } else {
            setWalletAddress('');
            setWalletBalance('');
        }
    }, [isAuthenticated, user?.walletAddress, fetchBalance]);

    useEffect(() => {
        checkWallet();
    }, [checkWallet]);

    // Lắng nghe sự kiện chuyển tài khoản hoặc chuyển mạng trên MetaMask
    useEffect(() => {
        if (!window.ethereum) return;

        const handleAccountsChanged = async (accounts) => {
            if (!isAuthenticated) {
                setWalletAddress('');
                setWalletBalance('');
                return;
            }

            if (accounts && accounts.length > 0) {
                setWalletAddress(accounts[0]);
                await fetchBalance(accounts[0]);
            } else if (user?.walletAddress) {
                setWalletAddress(user.walletAddress);
                await fetchBalance(user.walletAddress);
            } else {
                setWalletAddress('');
                setWalletBalance('');
            }
        };

        const handleChainChanged = () => {
            if (walletAddress) {
                fetchBalance(walletAddress);
            }
        };

        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);

        return () => {
            if (window.ethereum?.removeListener) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            }
        };
    }, [isAuthenticated, walletAddress, user?.walletAddress, fetchBalance]);

    // Kết nối ví MetaMask
    const connectWallet = async () => {
        if (!window.ethereum) {
            throw new Error('Vui lòng cài đặt tiện ích mở rộng MetaMask trên trình duyệt!');
        }
        setIsConnecting(true);
        try {
            sessionStorage.removeItem('blocktickets_wallet_disconnected');
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (accounts && accounts[0]) {
                setWalletAddress(accounts[0]);
                await fetchBalance(accounts[0]);
                return accounts[0];
            }
        } finally {
            setIsConnecting(false);
        }
    };

    // Đổi tài khoản ví MetaMask (EIP-2255 wallet_requestPermissions)
    const switchWallet = async () => {
        if (!window.ethereum) {
            throw new Error('Vui lòng cài đặt tiện ích mở rộng MetaMask trên trình duyệt!');
        }
        try {
            sessionStorage.removeItem('blocktickets_wallet_disconnected');
            await window.ethereum.request({
                method: 'wallet_requestPermissions',
                params: [{ eth_accounts: {} }],
            });
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts && accounts[0]) {
                setWalletAddress(accounts[0]);
                await fetchBalance(accounts[0]);
                return accounts[0];
            }
        } catch (err) {
            if (err?.code !== 4001) {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                if (accounts && accounts[0]) {
                    setWalletAddress(accounts[0]);
                    await fetchBalance(accounts[0]);
                    return accounts[0];
                }
            }
            throw err;
        }
    };

    // Ngắt kết nối ví
    const disconnectWallet = async () => {
        try {
            if (window.ethereum?.request) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_revokePermissions',
                        params: [{ eth_accounts: {} }],
                    });
                } catch {
                    // bỏ qua nếu phiên bản MetaMask cũ không hỗ trợ
                }
            }
        } finally {
            setWalletAddress('');
            setWalletBalance('');
        }
    };

    // Liên kết ví vào tài khoản hồ sơ người dùng trong Database
    const linkWalletToAccount = async (targetAddress) => {
        const addressToLink = targetAddress || walletAddress;
        if (!addressToLink) {
            throw new Error('Chưa có địa chỉ ví để liên kết!');
        }
        if (!window.ethereum) {
            throw new Error('Yêu cầu tiện ích MetaMask để ký xác thực quyền sở hữu ví!');
        }

        setIsLinking(true);
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const nonceRes = await authAPI.getNonce(addressToLink);
            const nonce = nonceRes.data?.data?.nonce;
            if (!nonce) throw new Error('Không thể nhận chuỗi xác thực nonce từ máy chủ.');

            const signature = await signer.signMessage(nonce);
            await userAPI.linkWallet({
                walletAddress: addressToLink,
                signature,
                nonce,
            });

            updateUser({ walletAddress: addressToLink });
            setWalletAddress(addressToLink);
            await fetchBalance(addressToLink);
            return addressToLink;
        } finally {
            setIsLinking(false);
        }
    };

    return (
        <WalletContext.Provider
            value={{
                walletAddress,
                walletBalance,
                isConnecting,
                isLinking,
                connectWallet,
                switchWallet,
                disconnectWallet,
                linkWalletToAccount,
                refreshBalance: () => fetchBalance(walletAddress),
                checkWallet,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = () => {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error('useWallet phải được sử dụng bên trong WalletContextProvider');
    }
    return context;
};

