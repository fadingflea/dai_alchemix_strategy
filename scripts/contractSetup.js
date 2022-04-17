require('dotenv').config()

const { DEPLOYED_CONTRACT_ADDRESS } = process.env;

async function main() {
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

    // Alchemist Whitelist

    const alchemistWhitelistAdminAddress = "0x9e2b6378ee8ad2a4a95fe481d63caba8fb0ebbf9"
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [alchemistWhitelistAdminAddress],
    });

    const alchemistWhitelistAdmin = await ethers.getSigner(alchemistWhitelistAdminAddress);

    // DAI Contract
    const daiABI = [
      "event Approval(address indexed owner, address indexed spender, uint256 value)",
      "function approve(address spender, uint256 amount) external returns (bool)",
      "function balanceOf(address account) external view returns (uint256)"
    ];
    const daiContract = new ethers.Contract('0x6b175474e89094c44da98b954eedeac495271d0f', daiABI, daiHolder);

    const balance = await daiContract.balanceOf(daiHolder.address);
    console.log("Dai Holder balance:", balance.toString())

    console.log("1. Approving contract to spend DAI with address:", daiHolder.address);
    await daiContract.connect(daiHolder).approve(DEPLOYED_CONTRACT_ADDRESS, 100000000000000);

    console.log("2. Contact approved to spend DAI");

  // Alchemist Whitelist Contract
  const alchemistWhitelistABI = [
    "event AccountAdded(address account)",
    "function add(address caller) external",
    "function isWhitelisted(address account) external view returns (bool)"
  ];
  const alchemistWhitelistContract = new ethers.Contract('0x78537a6CeBa16f412E123a90472C6E0e9A8F1132', alchemistWhitelistABI, alchemistWhitelistAdmin);
  
  console.log("3. Whitelisting contract with alchemist admin address:", alchemistWhitelistAdmin.address);

  await alchemistWhitelistContract.connect(alchemistWhitelistAdmin).add(DEPLOYED_CONTRACT_ADDRESS);

  const whitelistedAddress = await alchemistWhitelistContract.isWhitelisted(DEPLOYED_CONTRACT_ADDRESS);

  console.log("4. Contract Whitelisted:", whitelistedAddress);

  // Alchemist Base Contract
  const alchemistBaseABI = [
    "function approveMint(address spender, uint256 amount) external",
    "function mintAllowance(address owner, address spender) external view returns (uint256)"
  ];
  const alchemistBaseContract = new ethers.Contract('0x5C6374a2ac4EBC38DeA0Fc1F8716e5Ea1AdD94dd', alchemistBaseABI, daiHolder);
  
  console.log(`5. Approving contract minting from owner: ${daiHolder.address} to spender: ${DEPLOYED_CONTRACT_ADDRESS}`);

  await alchemistBaseContract.connect(daiHolder).approveMint(DEPLOYED_CONTRACT_ADDRESS, 1000000000000000);

  const mintAmountAllowance = await alchemistBaseContract.mintAllowance(daiHolder.address, DEPLOYED_CONTRACT_ADDRESS);

  console.log("6. Mint allowance:", mintAmountAllowance.toString());
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });