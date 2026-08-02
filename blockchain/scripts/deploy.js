const { ethers } = require("hardhat");

const main = async () => {
  const MedicalRecord = await ethers.getContractFactory("MedicalRecord");
  const contract = await MedicalRecord.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("MedicalRecord deployed at:", address);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

