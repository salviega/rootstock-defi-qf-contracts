interface networkConfigItem {
	ethUsdPriceFeed?: string
	blockConfirmations?: number
}

interface networkConfigInfo {
	[key: string]: networkConfigItem
}

export const networkConfig: networkConfigInfo = {
	hardhat: {},
	localhost: {
		blockConfirmations: 3
	},
	rsktestnet: {
		blockConfirmations: 3
	}
}

export const developmentChains: string[] = ['hardhat', 'localhost']
