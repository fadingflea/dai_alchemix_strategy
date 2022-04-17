// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

interface ICurveMetapool {
    function add_liquidity(uint256[2] memory amounts, uint256 min_mint_amount)
        external
        returns (uint256);

    function calc_token_amount(uint256[2] memory amounts, bool _is_deposit)
        external
        returns (uint256);
}
