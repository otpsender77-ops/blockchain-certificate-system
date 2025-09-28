// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleCertificateRegistry {
    uint256 public totalCertificates;
    
    struct Certificate {
        string certificateId;
        string studentName;
        string courseName;
        string instituteName;
        uint256 issueDate;
        string certificateHash;
        bool isValid;
    }
    
    mapping(string => Certificate) public certificates;
    
    event CertificateIssued(
        string indexed certificateId,
        string studentName,
        string courseName,
        string instituteName,
        uint256 issueDate,
        string certificateHash
    );
    
    constructor() {
        totalCertificates = 0;
    }
    
    function issueCertificate(
        string memory _certificateId,
        string memory _studentName,
        string memory _courseName,
        string memory _instituteName,
        uint256 _issueDate,
        string memory _certificateHash
    ) public {
        require(bytes(_certificateId).length > 0, "Certificate ID cannot be empty");
        require(bytes(_studentName).length > 0, "Student name cannot be empty");
        require(bytes(_courseName).length > 0, "Course name cannot be empty");
        
        certificates[_certificateId] = Certificate({
            certificateId: _certificateId,
            studentName: _studentName,
            courseName: _courseName,
            instituteName: _instituteName,
            issueDate: _issueDate,
            certificateHash: _certificateHash,
            isValid: true
        });
        
        totalCertificates++;
        
        emit CertificateIssued(
            _certificateId,
            _studentName,
            _courseName,
            _instituteName,
            _issueDate,
            _certificateHash
        );
    }
    
    function verifyCertificate(string memory _certificateId) 
        public 
        view 
        returns (
            string memory studentName,
            string memory courseName,
            string memory instituteName,
            uint256 issueDate,
            string memory certificateHash,
            bool isValid
        ) 
    {
        Certificate memory cert = certificates[_certificateId];
        return (
            cert.studentName,
            cert.courseName,
            cert.instituteName,
            cert.issueDate,
            cert.certificateHash,
            cert.isValid
        );
    }
    
    function getTotalCertificates() public view returns (uint256) {
        return totalCertificates;
    }
}
