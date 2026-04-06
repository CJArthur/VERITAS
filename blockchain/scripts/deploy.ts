import { ethers } from "hardhat";

async function main() {
  const VeritasAnchor = await ethers.getContractFactory("VeritasAnchor");
  const contract = await VeritasAnchor.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`VeritasAnchor deployed to: ${address}`);
  console.log(`Add to .env: CONTRACT_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
