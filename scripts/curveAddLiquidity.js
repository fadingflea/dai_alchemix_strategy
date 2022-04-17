require('dotenv').config()

const { DEPLOYED_CONTRACT_ADDRESS } = process.env;

async function main() {
    // Set up an ethers contract, representing our deployed Box instance
    const DaiAlchemixStrategy = await ethers.getContractFactory("DaiAlchemixStrategy");
    const daiAlchemixStrategy = await DaiAlchemixStrategy.attach(DEPLOYED_CONTRACT_ADDRESS);

    // Signers

    // Regular
    [user1, user2, user3] = await hre.ethers.getSigners(); 

    // alUSD

    const alUSDHolderAddress = "0x98116CaE5813810941A0404F4208a5355c595A9D"

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [alUSDHolderAddress],
    });

    const alUSDHolder = await ethers.getSigner(alUSDHolderAddress);

    const alUSDTokenAddress = "0xBC6DA0FE9aD5f3b0d58160288917AA56653660E9";
    const poolAddress = "0x43b4FdFD4Ff969587185cDB6f0BD875c5Fc83f8c";

    // AlUSD Contract
    const alUSDAbi = [
      "event Approval(address indexed owner, address indexed spender, uint256 value)",
      "function approve(address spender, uint256 amount) external returns (bool)",
      "function balanceOf(address account) external view returns (uint256)",
      "function transfer(address to, uint256 amount) external returns (bool)"
    ];
    const alUSDContract = new ethers.Contract(alUSDTokenAddress, alUSDAbi, alUSDHolder);

    // await contract.curveAddLiquidity("0x43b4FdFD4Ff969587185cDB6f0BD875c5Fc83f8c", "0xBC6DA0FE9aD5f3b0d58160288917AA56653660E9");

    // Execute Operation

    console.log("Executing operation with address:", alUSDHolder.address);

    const alUSDBalance = await alUSDContract.balanceOf(alUSDHolder.address);
      console.log("alUSD balance:", alUSDBalance.toString());
      console.log("Transfering alUSD balance to contract:", DEPLOYED_CONTRACT_ADDRESS);
      await alUSDContract.connect(alUSDHolder).transfer(DEPLOYED_CONTRACT_ADDRESS, ethers.utils.parseEther("10000"));


    try {
      await daiAlchemixStrategy.connect(alUSDHolder).curveAddLiquidity(poolAddress, alUSTokenAddress);
      const LPbalance = await daiAlchemixStrategy.contractLPTokenBalance(); 
      console.log("Address LP balance:", LPbalance.toString())
    } catch (error) {
      console.log(error)
    }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });