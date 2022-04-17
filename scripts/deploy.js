async function main() {
    const [deployer] = await ethers.getSigners();
  
    console.log("Deploying contracts with the account:", deployer.address);

    this.DaiAlchemixStrategy = await hre.ethers.getContractFactory("DaiAlchemixStrategy");
    this.daiAlchemixStrategy = await this.DaiAlchemixStrategy.deploy();
  
    console.log("Token address:", daiAlchemixStrategy.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });