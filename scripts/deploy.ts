import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

// import verify from '../helper-functions'
import { getImplementationAddress } from '../utils/functions/upgrades/get-implementation-address'

import { BaseContract, Contract, ContractFactory } from 'ethers'
import fs from 'fs'
import { ethers, upgrades } from 'hardhat'
import path from 'path'

interface Accounts {
	owner: SignerWithAddress
	admin: SignerWithAddress
}

interface Contracts {
	networkName: string
	generateProfileId: any
	doCMock: any
	registryInstance: any
	alloInstance: any
	qVSimpleStrategyContract: any
}

interface Metadata {
	protocol: string
	pointer: string
}

interface Profile {
	id: string
	nonce: string
	name: string
	metadata: Metadata
	owner: string
	anchor: string
}

let accounts: Accounts
let contracts: Contracts

function dtoToProfile(dto: any): Profile {
	const nonce: string = dto[1].toString()
	const protocol: string = dto[3][0].toString()

	return {
		id: dto[0],
		nonce,
		name: dto[2],
		metadata: {
			protocol,
			pointer: dto[3][1]
		},
		owner: dto[4],
		anchor: dto[5]
	}
}

async function main() {
	const signers = await ethers.getSigners()

	accounts = {
		owner: signers[0],
		admin: signers[1]
	}

	const { admin } = accounts

	contracts = await deployContracts()

	const { generateProfileId, registryInstance } = contracts

	const adminDir = path.join('admin', contracts.networkName)
	const adminFile = path.join(adminDir, 'admin.json')

	// Crear directorio y archivo si no existen
	if (!fs.existsSync(adminDir)) {
		fs.mkdirSync(adminDir, { recursive: true })
	}

	let adminJson: any = {}

	if (fs.existsSync(adminFile)) {
		adminJson = JSON.parse(fs.readFileSync(adminFile).toString())
	}

	adminJson.profile = {}

	// Create profile
	console.log(' 🚩  1. Create profile')

	const adminNonce: number = await ethers.provider.getTransactionCount(
		admin.address
	)
	const adminName: string = 'admin'
	const adminMetadata: Metadata = {
		protocol: '1',
		pointer: 'ipfs://QmQmQmQmQmQmQmQmQmQmQmQmQm'
	}
	const adminMembersAddresses: string[] = []

	const createProfileTx = await registryInstance.connect(admin).createProfile(
		adminNonce, // _nonce
		adminName, // _name
		[adminMetadata.protocol, adminMetadata.pointer], // _metadata
		admin.address, // ownerAddress
		adminMembersAddresses // _membersAddresses
	)

	await createProfileTx.wait()

	// const transactionReceipt = await ethers.provider.getTransactionReceipt(
	// 	createProfileTx.hash
	// )
	// const transactionBlockNumber = transactionReceipt.blockNumber

	// const events = await registryInstance.queryFilter(
	// 	'ProfileCreated',
	// 	transactionBlockNumber
	// )
	// const event = events[events.length - 1]

	// const adminProfileId = event.args.profileId
	const adminProfileId = await generateProfileId.generateProfileId(
		adminNonce,
		admin.address
	)
	const adminProfileDto = await registryInstance.getProfileById(adminProfileId)
	const adminProfile: Profile = dtoToProfile(adminProfileDto)

	adminJson.profile = adminProfile
	fs.writeFileSync(adminFile, JSON.stringify(adminJson))
	console.log(' ✅  Profile created')
}

async function deployContracts() {
	const network = await ethers.provider.getNetwork()
	let networkName = network.name

	if (networkName === 'unknown' || networkName === 'hardhat') {
		networkName = 'localhost'
	}

	const networkDir = path.join('.', 'deployments', networkName)
	if (!fs.existsSync(networkDir)) {
		fs.mkdirSync(networkDir, { recursive: true })
	}

	const [owner] = await ethers.getSigners()

	// Deploy GenerateProfileId contract
	const generateProfileId = await deployContract('GenerateProfileId', [])
	const generateProfileIdTx = generateProfileId.deploymentTransaction()

	// Deploy DAIMock contract
	const doCMock = await deployContract('DoCMock', [])
	const doCMockTx = doCMock.deploymentTransaction()
	// await verify(await doCMock.getAddress(), [])

	// Deploy Registry contract
	const Registry: ContractFactory<any[], BaseContract> =
		await ethers.getContractFactory('Registry')

	const registryArgs: any[] = [owner.address]
	const registryInstance: Contract = await upgrades.deployProxy(
		Registry,
		registryArgs
	)

	await registryInstance.waitForDeployment()
	const registryInstanceTx = registryInstance.deploymentTransaction()

	const registryInstanceAddress: string = registryInstance.target as string
	// await verify(registryInstanceAddress, [])

	const registryImplementationAddress: string = await getImplementationAddress(
		registryInstanceAddress
	)

	// await verify(registryImplementationAddress, [])

	// Deploy Allo contract
	const Allo: ContractFactory<any[], BaseContract> =
		await ethers.getContractFactory('Allo')

	const alloArgs: any = [
		owner.address, // owner
		registryInstanceAddress, // registryAddress
		owner.address, // treasury,
		0, // percentFee,
		0 // baseFee,
	]
	const alloInstance: Contract = await upgrades.deployProxy(Allo, alloArgs)
	await alloInstance.waitForDeployment()
	const alloInstanceTx = alloInstance.deploymentTransaction()

	const alloInstanceAddress: string = alloInstance.target as string
	// await verify(alloInstanceAddress, [])
	const alloImplementationAddress: string = await getImplementationAddress(
		alloInstanceAddress
	)
	// await verify(alloImplementationAddress, [])

	// Deploy Quadratic Voting Strategy contract
	const qVSimpleStrategyArgs: any[] = [
		alloInstanceAddress, // _alloAddress
		'Cuadratic voting simple strategy' // _strategyName
	]
	const qVSimpleStrategyContract = await deployContract(
		'QVSimpleStrategy',
		qVSimpleStrategyArgs
	)
	const qVSimpleStrategyTx = qVSimpleStrategyContract.deploymentTransaction()
	// await verify(
	// 	await qVSimpleStrategyContract.getAddress(),
	// 	qVSimpleStrategyArgs
	// )

	// Log deployed contracts
	console.log('\n 📜 Deployed contracts')
	console.table({
		generateProfileId: await generateProfileId.getAddress(),
		doCMock: await doCMock.getAddress(),
		registryInstance: registryInstanceAddress,
		registryImplementation: registryImplementationAddress,
		alloInstance: alloInstanceAddress,
		alloImplementation: alloImplementationAddress,
		qVSimpleStrategyContract: await qVSimpleStrategyContract.getAddress()
	})

	const contractsDeployed = {
		generateProfileId: {
			blockNumber: generateProfileIdTx?.blockNumber,
			address: await generateProfileId.getAddress(),
			abi: JSON.parse(generateProfileId.interface.formatJson())
		},
		doCMock: {
			blockNumber: doCMockTx?.blockNumber,
			address: await doCMock.getAddress(),
			abi: JSON.parse(doCMock.interface.formatJson())
		},
		registryInstance: {
			blockNumber: registryInstanceTx?.blockNumber,
			address: registryInstanceAddress,
			abi: JSON.parse(Registry.interface.formatJson())
		},
		registryImplementation: {
			address: registryImplementationAddress
		},
		alloInstance: {
			blockNumber: alloInstanceTx?.blockNumber,
			address: alloInstanceAddress,
			abi: JSON.parse(Allo.interface.formatJson())
		},
		alloImplementation: {
			address: alloImplementationAddress
		},
		qVSimpleStrategyContract: {
			blockNumber: qVSimpleStrategyTx?.blockNumber,
			address: await qVSimpleStrategyContract.getAddress(),
			abi: JSON.parse(qVSimpleStrategyContract.interface.formatJson()),
			bytecode: (await qVSimpleStrategyContract.getDeployedCode()) as string
		}
	}

	const deployments = JSON.stringify(contractsDeployed, null, 2)
	fs.writeFileSync(path.join(networkDir, 'deployments.json'), deployments)

	// Return all deployed contracts
	return {
		networkName,
		generateProfileId,
		doCMock,
		registryInstance,
		alloInstance,
		qVSimpleStrategyContract
	}
}

async function deployContract(contractName: string, args: any[]) {
	const ContractFactory: ContractFactory = await ethers.getContractFactory(
		contractName
	)
	const contract = await ContractFactory.deploy(...args)
	return contract
}

main()
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error)
		process.exit(1)
	})
