// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");


module.exports = buildModule("SharedWalletModule", (m) => {

  const beneficiary = m.getAccount(1);
  const sharedWallet = m.contract("SharedWallet", [beneficiary]);

  return { sharedWallet };
});
