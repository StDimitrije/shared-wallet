# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/SharedWallet.js --network localhost
npx hardhat console --network localhost
```

```shell
# instantiate contract
const myContract = await ethers.getContractAt("SharedWallet","<address>")
# parse ether with 
await ethers.utils.parseEther("1")

# get account balance
await ethers.provider.getBalance("CONTRACT_ADDRESS")

# using a different account
await myContract.connect(addr1).transfer(addr2.address, 50);
```
