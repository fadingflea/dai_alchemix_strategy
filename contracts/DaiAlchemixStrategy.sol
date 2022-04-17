// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "../interfaces/IWhitelist.sol";
import "../interfaces/IERC20.sol";
import "../interfaces/IAlchemistV2.sol";
import "../interfaces/ICurveMetapool.sol";
import "../interfaces/IYearnVault.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

contract DaiAlchemixStrategy is Ownable {
    IWhitelist constant whitelist =
        IWhitelist(0x78537a6CeBa16f412E123a90472C6E0e9A8F1132);

    address CURVE_METAPOOL_ADDRESS = 0x43b4FdFD4Ff969587185cDB6f0BD875c5Fc83f8c;

    address YEARN_VAULT_ADDRESS = 0xA74d4B67b3368E83797a35382AFB776bAAE4F5C8;

    address ALCHEMIST_ADDRESS = 0x5C6374a2ac4EBC38DeA0Fc1F8716e5Ea1AdD94dd;

    address public yieldTokenAddress =
        0xdA816459F1AB5631232FE5e97a05BBBb94970c95;

    /// @notice When the msg.sender is not whitelisted
    error Unauthorized(address sender);

    /// @notice When we're passed invalid parameters
    error IllegalArgument(string reason);

    /// @notice When the yieldToken has no underlyingToken in the alchemist
    error UnsupportedYieldToken(address yieldToken);

    /// @notice When the collateral is insufficient to mint targetDebt
    error MintFailure();

    /// @notice Approve a contract to spend tokens
    function approve(address token, address spender) internal {
        IERC20(token).approve(spender, type(uint256).max);
    }

    function getUnderlyingToken() public view returns (address) {
        // Get underlying token from alchemist
        address underlyingToken = IAlchemistV2(ALCHEMIST_ADDRESS)
            .getYieldTokenParameters(yieldTokenAddress)
            .underlyingToken;
        if (underlyingToken == address(0))
            revert UnsupportedYieldToken(yieldTokenAddress);

        return underlyingToken;
    }

    /// @notice Executes whole operation
    /// @param collateralValue The value of the collateral to deposit on Alchemix
    /// @param targetDebt The amount of debt that the user will incur
    /// @return success Always true unless reverts
    function executeOperation(uint256 collateralValue, uint256 targetDebt)
        external
        payable
        returns (bool)
    {
        address underlyingToken = getUnderlyingToken();
        address recipient = msg.sender;

        // Gate on EOA or whitelisted
        if (!(tx.origin == recipient || whitelist.isWhitelisted(msg.sender)))
            revert Unauthorized(msg.sender);

        // Check if user has that balance
        require(
            IERC20(underlyingToken).balanceOf(recipient) >= collateralValue,
            "Not enough balance"
        );

        // Check targetDebt < 0.5 * collateralValue
        require(
            targetDebt <= collateralValue / 2,
            "Debt greater than collateral value / 2"
        );

        _transferTokensToSelf(underlyingToken, collateralValue);

        // Deposit into Alchemix recipient's account
        approve(underlyingToken, ALCHEMIST_ADDRESS);

        IAlchemistV2(ALCHEMIST_ADDRESS).depositUnderlying(
            yieldTokenAddress,
            collateralValue,
            recipient,
            0
        );

        // Mint from recipient's account
        try
            IAlchemistV2(ALCHEMIST_ADDRESS).mintFrom(
                recipient,
                targetDebt,
                address(this)
            )
        {} catch {
            revert MintFailure();
        }

        // Deposit into Curve's pool
        address debtToken = IAlchemistV2(ALCHEMIST_ADDRESS).debtToken();

        curveAddLiquidity(CURVE_METAPOOL_ADDRESS, debtToken);

        // Deposit into Yearn Vault

        yearnVaultDeposit(YEARN_VAULT_ADDRESS, CURVE_METAPOOL_ADDRESS);

        return true;
    }

    /// @notice Either convert received eth to weth, or transfer ERC20 from the msg.sender to this contract
    /// @param underlyingToken The ERC20 desired to transfer
    /// @param collateralInitial The amount of tokens taken from the user

    function _transferTokensToSelf(
        address underlyingToken,
        uint256 collateralInitial
    ) internal {
        if (msg.value > 0) revert IllegalArgument("msg.value should be 0");
        IERC20(underlyingToken).transferFrom(
            msg.sender,
            address(this),
            collateralInitial
        );
    }

    /// @notice Either convert received eth to weth, or transfer ERC20 from the msg.sender to this contract
    /// @param underlyingToken The ERC20 desired to transfer
    /// @param swapAmount The amount of tokens after swap
    /// @param recipient Address that will receive the final tokens

    function _transferTokensToRecipient(
        address underlyingToken,
        uint256 swapAmount,
        address recipient
    ) internal {
        if (msg.value > 0) revert IllegalArgument("msg.value should be 0");
        IERC20(underlyingToken).transferFrom(
            address(this),
            recipient,
            swapAmount
        );
    }

    /// @notice Add Liquidity on curve using the supplied params
    /// @param poolAddress Curve pool address
    /// @param debtToken The alAsset debt token address
    function curveAddLiquidity(address poolAddress, address debtToken)
        public
        returns (uint256 amountOut)
    {
        uint256 debtTokenBalance = IERC20(debtToken).balanceOf(address(this));
        approve(debtToken, poolAddress);

        uint256 minLPTokens = (ICurveMetapool(poolAddress).calc_token_amount(
            [debtTokenBalance, 0],
            true
        ) * 99) / 100;

        return
            ICurveMetapool(poolAddress).add_liquidity(
                [debtTokenBalance, 0],
                minLPTokens
            );
    }

    /// @notice Add Liquidity on curve using the supplied params
    /// @param vaultAddress Yearn vault address
    /// @param curveLPToken The curve LP Token
    function yearnVaultDeposit(address vaultAddress, address curveLPToken)
        public
        returns (uint256 amountOut)
    {
        uint256 LPTokenBalance = IERC20(curveLPToken).balanceOf(address(this));
        approve(curveLPToken, vaultAddress);

        return IYearnVault(vaultAddress).deposit(LPTokenBalance, msg.sender);
    }

    // ONLY OWNER SET PARAMS

    /// @notice Set new token
    /// @param newYieldTokenAddress ERC20 token contract address
    function setYieldTokenAddress(address newYieldTokenAddress)
        public
        onlyOwner
    {
        require(
            IAlchemistV2(ALCHEMIST_ADDRESS).isSupportedYieldToken(
                newYieldTokenAddress
            ),
            "Yield Token not supported by Alchemix"
        );

        yieldTokenAddress = newYieldTokenAddress;
    }

    /// Extra functions for testing

    function ERC20UnderlyingBalanceOf() public view returns (uint256) {
        address recipient = msg.sender;
        address underlyingToken = getUnderlyingToken();

        uint256 balance = IERC20(underlyingToken).balanceOf(recipient);

        return balance;
    }

    function contractDebtTokenBalance() public view returns (uint256) {
        address debtToken = IAlchemistV2(ALCHEMIST_ADDRESS).debtToken();

        uint256 balance = IERC20(debtToken).balanceOf(address(this));

        return balance;
    }

    function contractLPTokenBalance() public view returns (uint256) {
        uint256 balance = IERC20(CURVE_METAPOOL_ADDRESS).balanceOf(
            address(this)
        );

        return balance;
    }
}
