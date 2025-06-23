const { expect } = require("chai");
const { ethers } = require("hardhat");
// We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
// const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

// `describe` is a Mocha function that allows you to organize your tests.
// Having your tests organized makes debugging them easier. All Mocha
// functions are available in the global scope.
//
// `describe` receives the name of a section of your test suite, and a
// callback. The callback must define the tests of that section. This callback
// can't be an async function.
describe("SharedWallet", function () {
  async function deploySharedWallet() {

    // Contracts are deployed using the first signer/account by default
    const [owner, guardian, ben1, ben2, ben3] = await ethers.getSigners();

    const SharedWallet = await ethers.getContractFactory("SharedWallet");
    const sharedWallet = await SharedWallet.deploy(guardian.address, { value: ethers.parseEther("5") });
    await sharedWallet.waitForDeployment();

    return { sharedWallet, guardian, owner, ben1, ben2, ben3 };
  }

  describe("Deployment", function() {
    it("Deploy Wallet with inital ETH", async function () {
      const { sharedWallet } = await loadFixture(deploySharedWallet);
      const balance = await ethers.provider.getBalance(await sharedWallet.getAddress());
      expect(balance).to.equal(ethers.parseEther("5"));
    });
  
    it("Should set the right owner", async function () {
      const { sharedWallet, owner } = await loadFixture(deploySharedWallet);
      expect(await sharedWallet.owner()).to.equal(owner.address);
    });
  
    it("Should assign a guardian", async function () {
      const { sharedWallet, guardian } = await loadFixture(deploySharedWallet);
      expect(await sharedWallet.recoveryGuardian()).to.equal(guardian.address);
    });
  })

  describe("Users Management", function() {
    it("Should set a beneficiary with allowance", async function () {
      const {sharedWallet, owner, ben1 } = await loadFixture(deploySharedWallet);
  
      await sharedWallet.connect(owner).addBeneficiary(ben1.address, ethers.parseEther("1"), ethers.parseEther("1"))
      const [balance, limit, spent] = await sharedWallet.getBeneficiaryData(ben1.address);
      expect(balance).to.equal(ethers.parseEther("1"));
      expect(limit).to.equal(ethers.parseEther("1"));
      expect(spent).to.equal(0);
  
    });
  });

  describe("Transactions", function() {
    it("Should allow deposit and track balance", async function () {
      const {sharedWallet, owner } = await loadFixture(deploySharedWallet);
      await sharedWallet.connect(owner).deposit({value: ethers.parseEther("2")});
  
      const [contractBalance, walletBalance] = await sharedWallet.getWalletBalance();
  
      expect(contractBalance).to.equal(ethers.parseEther("7"))
      expect(contractBalance).to.equal(walletBalance);
    })
  
    it("Should allow withdrawal within daily limit", async function () {
      const {sharedWallet, owner, ben1 } = await loadFixture(deploySharedWallet);
      await sharedWallet.connect(owner).addBeneficiary(ben1.address, ethers.parseEther("1"), ethers.parseEther("1"));
  
      const before = await ethers.provider.getBalance(ben1.address);

      const tx = await sharedWallet.connect(ben1).withdraw(ethers.parseEther("0.5"));
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const after = await ethers.provider.getBalance(ben1.address);

      expect(after).to.be.closeTo(before + ethers.parseEther("0.5"),gasUsed);
    })

    it("Should prevent exceeding daily limit", async function () {
      const {sharedWallet, owner, ben1 } = await loadFixture(deploySharedWallet);
      await sharedWallet.connect(owner).addBeneficiary(ben1.address, ethers.parseEther("1"), ethers.parseEther("0.5"));
      await sharedWallet.connect(ben1).withdraw(ethers.parseEther("0.5"));

      await expect(sharedWallet.connect(ben1).withdraw(ethers.parseEther("0.2"))).to.be.revertedWith("Daily limit exceeded");
    })

    it("Should allow transfer to another EOA", async function () {
      const {sharedWallet, owner, ben1, ben2 } = await loadFixture(deploySharedWallet);
      await sharedWallet.connect(owner).addBeneficiary(ben1.address, ethers.parseEther("1"), ethers.parseEther("1"));

      const before = await ethers.provider.getBalance(ben2.address);
      const tx = await sharedWallet.connect(ben1).transferTo(ben2.address, ethers.parseEther("0.25"));
      const receipt = await tx.wait();
      const after = await ethers.provider.getBalance(ben2.address);

      expect(after - before).to.equal(ethers.parseEther("0.25"));

      const event = receipt.logs.find(log => log.fragment?.name === "EtherTransferred");
      expect(event).to.exist;
      expect(event.args.from).to.equal(ben1.address);
      expect(event.args.to).to.equal(ben2.address);
      expect(event.args.amount).to.equal(ethers.parseEther("0.25"));
    })
  })
});