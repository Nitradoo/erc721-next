pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";


contract NFTMint is ERC721, ERC721Enumerable, Ownable, Pausable {
    using Counters for Counters.Counter;
    using Strings for uint256;
    address public signer;
    string public URIlink;

    mapping(address => bool) public wlMintDone;

    event Minted(address indexed to);

    Counters.Counter private _tokenIdCounter;


    constructor(address _signer) ERC721("testNFT", "TST") {
        signer = _signer;
        _pause();
    }

    function checkValidity(bytes calldata signature, string memory action)
        public
        view
        returns (bool)
    {
        require(
            ECDSA.recover(
                ECDSA.toEthSignedMessageHash(
                    keccak256(abi.encodePacked(msg.sender, action))
                ),
                signature
            ) == signer,
            "invalid signature"
        );
        return true;
    }

    function changeURI(string memory _URI) public onlyOwner {
        URIlink = _URI;
    }

    function _baseURI() internal view override returns (string memory) {
        return URIlink;
    }

    function safeMint(address to) internal whenNotPaused {
        uint256 tokenId = _tokenIdCounter.current();
        require(tokenId <= 2000);
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        
        emit Minted(to);
    }

    function whitelistMint(bytes calldata signature) external payable whenNotPaused {
        require(!wlMintDone[msg.sender], "already minted once!");
        checkValidity(signature, "whitelist-mint");
        wlMintDone[msg.sender] = true;
        safeMint(msg.sender);
    }

    function batchMint(uint amount) public payable whenNotPaused {
        require(msg.value == 0.001 ether*amount);
        require(amount<=10, "max amount is 10");
        uint i=0;
        for(i;i<amount;i++){
            safeMint(msg.sender);
        }
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireMinted(tokenId);
        string memory baseURI = _baseURI();
        string memory basePlusId = string(abi.encodePacked(baseURI, tokenId.toString()));
        return bytes(baseURI).length > 0 ?string(abi.encodePacked(basePlusId, string(".json"))) : "";
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
    internal
    override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function getCounter() public view returns (uint){
            return _tokenIdCounter.current();
        }

    function getSigner() public view returns (address){
        return signer;
    }

    //owner functions

    function setSigner(address _signer) external onlyOwner {
        signer = _signer;
    }

    function widthdrawContractBalance() external onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }
}