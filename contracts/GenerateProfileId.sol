// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract GenerateProfileId {
	function generateProfileId(
		uint256 _nonce,
		address _owner
	) external pure returns (bytes32) {
		return keccak256(abi.encodePacked(_nonce, _owner));
	}
}
