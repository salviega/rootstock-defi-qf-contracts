import contractsJson from '../deployments/bsctestnet/deployments.json'

import dotenv from 'dotenv'
import { ethers } from 'ethers'

dotenv.config()

const {
	ROOTSTOCK_RPC_URL,
	WALLET1_PRIVATE_KEY,
	WALLET2_PRIVATE_KEY,
	WALLET3_PRIVATE_KEY,
	WALLET4_PRIVATE_KEY,
	WALLET5_PRIVATE_KEY,
	WALLET6_PRIVATE_KEY,
	WALLET7_PRIVATE_KEY,
	WALLET8_PRIVATE_KEY
} = process.env

if (!ROOTSTOCK_RPC_URL) {
	throw new Error('ROOTSTOCK_RPC_URL is not set')
}

if (!WALLET1_PRIVATE_KEY) {
	throw new Error('WALLET1_PRIVATE_KEY is not set')
}

if (!WALLET2_PRIVATE_KEY) {
	throw new Error('WALLET2_PRIVATE_KEY is not set')
}

if (!WALLET3_PRIVATE_KEY) {
	throw new Error('WALLET3_PRIVATE_KEY is not set')
}

if (!WALLET4_PRIVATE_KEY) {
	throw new Error('WALLET4_PRIVATE_KEY is not set')
}

if (!WALLET5_PRIVATE_KEY) {
	throw new Error('WALLET5_PRIVATE_KEY is not set')
}

if (!WALLET6_PRIVATE_KEY) {
	throw new Error('WALLET6_PRIVATE_KEY is not set')
}

if (!WALLET7_PRIVATE_KEY) {
	throw new Error('WALLET7_PRIVATE_KEY is not set')
}

if (!WALLET8_PRIVATE_KEY) {
	throw new Error('WALLET8_PRIVATE_KEY is not set')
}

const provider = new ethers.JsonRpcProvider(ROOTSTOCK_RPC_URL)
const signer = new ethers.Wallet(WALLET1_PRIVATE_KEY, provider)

const registryContract = new ethers.Contract(
	contractsJson.registryInstance.address,
	contractsJson.registryInstance.abi,
	signer
)

const recipients = [
	WALLET2_PRIVATE_KEY,
	WALLET3_PRIVATE_KEY,
	WALLET4_PRIVATE_KEY,
	WALLET5_PRIVATE_KEY,
	WALLET6_PRIVATE_KEY,
	WALLET7_PRIVATE_KEY,
	WALLET8_PRIVATE_KEY
]

async function addMembers() {
	try {
		const addMemberTx = await registryContract.addMembers(
			'0xbd71c97162a5a1b0c45de7e244d7aa9b028ac578b6a136f356edd0df7a84bb59',
			recipients
		)
		await addMemberTx.wait()
		console.log('✅ Successfully added members to the registry')
	} catch (error) {
		console.error('Failed to add members to the registry:', error)
	}
}

addMembers()
