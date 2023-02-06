import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

import nftABI from "../ABI/NFTABI.json";

function App() {
    const [haveMetamask, sethaveMetamask] = useState(true);
    const [accountAddress, setAccountAddress] = useState('');
    const [accountBalance, setAccountBalance] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [allMessages, setAllMessages] = useState([]);
    const [messageValue, setMessageValue] = useState("");
    const [nameValue, setNameValue] = useState("");
    const [mintingNFT, setMintingNFT] = useState(false);
    const [network, setNetwork] = useState("");
    const [ownedTokens, setOwnedTokens] = useState([]);
    const [count, setCount] = useState(0);
    const [isWhitelisted, setIsWhitelisted] = useState();


    const contractAddress = "0xA921E5b098bda31b2BFCa84a6E57063351db202F";

    const wlSignatures = [
        {
        key: '0xBF9d7541915Ae295e09C70ea341ad5A25a76f4f9',
        value: '0x1668f15a7a7c1e3fc58f41938ac7dd2b471c01d22487f20ca5f99a1af31d2b44475ffc74b014acb09ea581f2b84fc9148cc5cc78f2790a852c429746ffb5bd711c'
        },
        {
        key: '0x67b6EefC53C325b4F62CA9cD54D71b3BB7d9De2D',
        value: '0x728c6333259eefa7001382c601e9229a0763cc538f7c7678b96782b1796971491a7e34afa21e168b983da55f2c5ae0be6988ba6e5b506e96f2487fc7e1681caa1c',
        },
    ]

    const handleChange = (event) => {
        if (event.target.id === "name") {
            setNameValue(event.target.value);
        } else {
            setMessageValue(event.target.value);
        }
    };

    useEffect(() => {
        const { ethereum } = window;
        if (ethereum) {


            let provider = new ethers.providers.Web3Provider(ethereum);
            let contract = new ethers.Contract(contractAddress, nftABI, provider);
            (async () => {
                setNetwork(await provider.getNetwork());
                let network = await provider.getNetwork();
                if (network.name !== "sepolia") {
                    alert('Please switch to the sepolia network');
                    ethereum.request({
                        method: "wallet_switchEthereumChain",
                        params: [{
                            chainId: "0xaa36a7"
                        }]
                    })
                        .then(() => {
                            location.reload();
                        })
                }
                if (ethereum) {
                    console.log('ethereum is available');
                    const accounts = await window.ethereum.request({
                        method: "eth_accounts",
                    });

                    if (accounts.length > 0) {
                        connectWallet();
                    }
                }


                ethereum.on("accountsChanged", (accounts) => {
                    if (accounts.length > 0) {
                        connectWallet();
                    } else {
                        setIsConnected(false);
                    }
                });

                const checkMetamaskAvailability = async () => {
                    if (!ethereum) {
                        sethaveMetamask(false);
                    }
                    sethaveMetamask(true);
                };
                checkMetamaskAvailability();
            })();
        }
    }, []);
    useEffect(() => {
        if (isConnected) {
            getOwnedNFTS();
        }
    }, [isConnected]);

    const connectWallet = async () => {
        try {
            if (!ethereum) {
                sethaveMetamask(false);
            }
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const accounts = await ethereum.request({
                method: 'eth_requestAccounts',
            });
            if (accounts.length > 0) {
                setIsConnected(true);
            }
            let balance = await provider.getBalance(accounts[0]);
            let bal = ethers.utils.formatEther(balance);
            setAccountAddress(accounts[0]);
            setAccountBalance(bal);
            setNetwork(await provider.getNetwork());

            setIsConnected(true);
        } catch (error) {
            setIsConnected(false);
        }
    };

    async function getOwnedNFTS() {
        console.log("Getting owned NFTS");
        setOwnedTokens([]);
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        let accountAddress = await provider.getSigner().getAddress();
        let contract = new ethers.Contract(
            contractAddress,
            nftABI,
            provider
        );
        let numberOfTokensOwned = await contract.balanceOf(accountAddress);
        for (let i = 0; i < Number(numberOfTokensOwned); i++) {
            const token = await contract.tokenOfOwnerByIndex(accountAddress, i);
            const URI = await contract.tokenURI(token);
            console.log(URI);

            const response = await fetch(URI.replace('ar://', 'https://arweave.net/'));
            const result = await response.json();
            result.id = token;
                setOwnedTokens(ownedTokens => [...ownedTokens, result]);
        }
    }

    async function checkWhitelist(){
        let provider = new ethers.providers.Web3Provider(window.ethereum);
        console.log(accountAddress);
        const wlsignature = wlSignatures.find(wlsignature => wlsignature.key.toString().toLowerCase() === accountAddress) ?? "none";
		console.log(wlsignature);
        if(wlsignature !== "none"){
            console.log(`user address is ${accountAddress}`);
            if(wlsignature.key.toString().toLowerCase() == accountAddress){
                setIsWhitelisted(true);
        }
        }
    }

    function increment() {
        setCount(function (prevCount) {
            if(prevCount < 2){
            return (prevCount += 1);
        } else {
            return (prevCount = 2);
        }
        });
    }

    function decrement() {
        setCount(function (prevCount) {
            if (prevCount > 0) {
                return (prevCount -= 1);
            } else {
                return (prevCount = 0);
            }
        });
    }
    
    async function mintNFT() {
        setMintingNFT(true);
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        let nftTotal = count*0.001
        let nftTotalWei = { value: ethers.utils.parseEther(nftTotal.toString())};
        let contract = new ethers.Contract(
            contractAddress,
            nftABI,
            provider.getSigner()
        );
        try{
            const transaction = await contract.batchMint(count, nftTotalWei);
            await transaction.wait();
            setMintingNFT(false);
            getOwnedNFTS();
        }catch(error){
            console.log(error);
            setMintingNFT(false);
            getOwnedNFTS();
        }
    }
    async function whitelistMint() {
        let signature = wlSignatures.find(wlsignature => wlsignature.key.toString().toLowerCase() === accountAddress) ?? "none";
        let provider = new ethers.providers.Web3Provider(window.ethereum);
        let contract = new ethers.Contract(
            contractAddress,
            nftABI,
            provider.getSigner()
        );
        let checkDone = await contract.wlMintDone(accountAddress);
        if(!checkDone){
        setMintingNFT(true);
        try{
            const transaction = await contract.whitelistMint(signature.value);
            await transaction.wait();
            setMintingNFT(false);
            getOwnedNFTS();
        }catch(error){
            console.log(error);
            setMintingNFT(false);
            getOwnedNFTS();
        }
    } else {
        alert("Free NFT already claimed.");
    }
    }


    return (
        <div className="w-full h-full">
            <header className="">
                {haveMetamask ? (
                    <div className="">
                        {isConnected ? (
                            <div className="">
                                <div className="">
                                    <h3>Wallet Address:</h3>
                                    <p>
                                        <a href={`https://etherscan.io/address/${accountAddress}`}>
                                            {accountAddress.slice(0, 4)}...
                                            {accountAddress.slice(38, 42)}
                                        </a>
                                    </p>
                                </div>
                                <div className="">
                                    <h3>Wallet Balance:</h3>
                                    <p>{accountBalance}</p>
                                </div>
                                <div className=''>
                                    <h3>Network:</h3>
                                    <p>{network.name}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-center text-xl font-semibold">Connect wallet:</p>
                        )}
                        {isConnected ? (
                            <div>
                                <div>


                                    <div className="w-96 m-auto shadow-xl rounded-xl bg-base-300 p-4">
                                        <div className="flex flex-col items-center justify-center gap-8">
                                            <h3 className="text-center text-xl font-semibold">Mint le NFT</h3>
                                            <p className="text-center text-xl font-semibold">Amount:</p>
                                            <div className="flex flex-row items-center justify-center gap-8">
                                                <button onClick={decrement} className="text-2xl font-bold">&lt;</button>
                                                <p className='font-semibold text-2xl'>{count}</p>
                                                <button onClick={increment} className="text-2xl font-bold">&gt;</button>
                                            </div>
                                            {mintingNFT ? (
                                                    <p className="info">Minting...</p>
                                                ) : (
                                                    <button className='btn btn-primary' onClick={mintNFT}>Mint</button>
                                                )}
                                        <div className='flex flex-col items-center justify-center gap-4 bg-slate-700 p-8 rounded-xl'>
                                            <button className='btn btn-primary' onClick={checkWhitelist}>check whitelist</button>
                                            {isWhitelisted ? (
                                                <>
                                                    <p className="text-xl">You are whitelisted!</p>
                                                    {mintingNFT ? (
                                                        <p className="info">Minting...</p>
                                                    ) : (<button className='btn btn-accent' onClick={whitelistMint}>Free whitelist mint</button>
                                                        
                                                    )}
                                                    
                                                </>
                                            ) : (
                                                <p className="text-xl"></p>
                                            )}
                                        </div>
                                        </div>
                                    </div>

                                    </div>
                                    {ownedTokens && ownedTokens.length > 0 && (
                                    <div>
                                        <h3 className="text-center text-xl font-semibold mt-8">Your NFTs:</h3>
                                        <div className="flex flex-row items-center justify-center gap-8 mt-8">

                                            {ownedTokens.map((item, index) => (
                                                <div className="card w-96 bg-base-100 shadow-xl" key={index}>
                                                    <figure><img src={item.image.replace('ar://', 'https://arweave.net/')} /></figure>
                                                    <div className="card-body">
                                                        <h2 className="card-title">{item.name}</h2>
                                                        <p>{item.description}</p>
                                                        <div className="card-actions justify-end">
                                                            <button className="btn btn-primary"><a href={`https://testnets.opensea.io/assets/goerli/0x9a24d31b045634fd56af7dd179f8800238ccdfe7/${item.id}`}>View on opensea</a></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    )}
                                </div>
                                ) : (
                                <div className='w-full h-full flex justify-center items-center'>
                                    <button className="btn" onClick={connectWallet}>
                                        Connect
                                    </button>
                                </div>
                        )}
                            </div>
                        ) : (
                            <p>Please Install MetaMask</p>
                        )}
                    </header>
        </div>
    );
}

export default App;