const WorkingCertificateRegistry = artifacts.require("WorkingCertificateRegistry");

module.exports = function (deployer) {
  deployer.deploy(WorkingCertificateRegistry);
};
