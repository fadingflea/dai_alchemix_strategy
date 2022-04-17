require('dotenv').config()

const { DEPLOYED_CONTRACT_ADDRESS } = process.env;

async function main() {
    // Set up an ethers contract, representing our deployed Box instance
    const DaiAlchemixStrategy = await ethers.getContractFactory("DaiAlchemixStrategy");
    const daiAlchemixStrategy = await DaiAlchemixStrategy.attach(DEPLOYED_CONTRACT_ADDRESS);

    // Signers

    // Regular
    [user1, user2, user3] = await hre.ethers.getSigners(); 

    // Dai
    const daiHolderAddress = "0x28c6c06298d514db089934071355e5743bf21d60"

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [daiHolderAddress],
    });

    const daiHolder = await ethers.getSigner(daiHolderAddress);

    // YVault Contract
    const yVaultAddress = "0xA74d4B67b3368E83797a35382AFB776bAAE4F5C8";
    const yVaultAbi = [
      "function balanceOf(address account) external view returns (uint256)",
    ];
    const yVaultContract = new ethers.Contract(yVaultAddress, yVaultAbi, daiHolder);

    const collateralValue = 5000;
    const targetDebt = collateralValue / 4;

    // Execute Operation

    console.log("Executing operation with address:", daiHolder.address);

    try {
      await daiAlchemixStrategy.connect(daiHolder).executeOperation(collateralValue, targetDebt);
      const yVaultbalance = await yVaultContract.balanceOf(daiHolder.address); 
      console.log("Address yvToken balance:", yVaultbalance.toString())
      // const LPbalance = await daiAlchemixStrategy.contractLPTokenBalance(); 
      // console.log("Address LP balance:", LPbalance.toString())
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