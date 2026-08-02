pragma solidity ^0.8.20;

contract MedicalRecord {
    struct Record {
        bytes32 recordHash;
        string patientId;
        address doctorId;
        uint256 timestamp;
    }

    mapping(uint256 => Record) private records;
    uint256 private totalRecords;
    address public admin;

    constructor() {
        admin = msg.sender;
    }

    modifier onlyDoctorOrAdmin() {
        require(msg.sender == admin, "Not authorized");
        _;
    }

    function addRecord(bytes32 recordHash, string memory patientId) external onlyDoctorOrAdmin {
        records[totalRecords] = Record({
            recordHash: recordHash,
            patientId: patientId,
            doctorId: msg.sender,
            timestamp: block.timestamp
        });

        totalRecords += 1;
    }

    function getRecord(uint256 id) external view returns (bytes32, string memory, address, uint256) {
        require(id < totalRecords, "Record does not exist");
        Record memory r = records[id];
        return (r.recordHash, r.patientId, r.doctorId, r.timestamp);
    }

    function getTotalRecords() external view returns (uint256) {
        return totalRecords;
    }
}
