// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

interface IYearnVault {
    function deposit(uint256 _amount, address recipient)
        external
        returns (uint256);
}
