// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.19;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract DoCMock is ERC20 {
	constructor() ERC20('DoCMock', 'DoC') {}

	function mint(uint256 _amount) public {
		_mint(msg.sender, _amount);
	}
}
