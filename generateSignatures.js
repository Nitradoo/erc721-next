import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
dotenv.config();


const whitelist = [
    '0xBF9d7541915Ae295e09C70ea341ad5A25a76f4f9',
    '0x67b6EefC53C325b4F62CA9cD54D71b3BB7d9De2D',
  ]
const privkey = process.env.SIGNER_PRIVATE_KEY;
for(let i=0; i<whitelist.length; i++){
        const signer = new ethers.Wallet(privkey)
        const addressHash = ethers.utils.solidityKeccak256(['address', 'string'], [whitelist[i].toLowerCase(), 'whitelist-mint'])
        const messageBytes = ethers.utils.arrayify(addressHash)
        let signature = await signer.signMessage(messageBytes)
        console.log(signature);
}