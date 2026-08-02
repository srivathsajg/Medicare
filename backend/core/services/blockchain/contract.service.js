const path = require("path");
const fs = require("fs");
const { ethers } = require("ethers");
const dotenv = require("dotenv");

dotenv.config();

const getContract = () => {
  const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545";
  const contractAddress = process.env.MEDICAL_RECORD_CONTRACT_ADDRESS;
  const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;

  if (!contractAddress) {
    throw new Error("MEDICAL_RECORD_CONTRACT_ADDRESS is not defined");
  }

  if (!privateKey) {
    throw new Error("BLOCKCHAIN_PRIVATE_KEY is not defined");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);

  const artifactPath = path.join(
    __dirname,
    "../../../../blockchain/artifacts/contracts/MedicalRecord.sol/MedicalRecord.json"
  );

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  return new ethers.Contract(contractAddress, artifact.abi, signer);
};

const getMedicalRecord = async (id) => {
  const contract = getContract();

  try {
    const result = await contract.getRecord(id);

    if (!result || Number(result[3]) === 0) {
      throw new Error("Record not found on blockchain");
    }

    return {
      recordHash: result[0], // This will now be a hex string starting with 0x
      patientId: result[1],
      doctorId: result[2],
      timestamp: Number(result[3]),
    };
  } catch (err) {
    throw new Error("Record not found on blockchain");
  }
};

const addRecord = async (recordHash, patientId) => {
  const contract = getContract();
  const currentTotal = await contract.getTotalRecords();

  // Ensure recordHash is a proper hex string for bytes32
  const formattedHash = recordHash.startsWith("0x") ? recordHash : `0x${recordHash}`;

  const tx = await contract.addRecord(formattedHash, patientId);
  const receipt = await tx.wait();

  const recordId = Number(currentTotal);

  return {
    txHash: receipt.hash,
    recordId,
  };
};

module.exports = {
  getMedicalRecord,
  addRecord,
};
