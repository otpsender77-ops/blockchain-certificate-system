const SimpleCertificateRegistry = artifacts.require("SimpleCertificateRegistry");

module.exports = function(deployer) {
  deployer.deploy(SimpleCertificateRegistry);
};
