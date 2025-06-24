const { expect } = require("chai");
const { ethers, network } = require("hardhat");
// We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
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
    const [owner, guardian, ...accounts] = await ethers.getSigners();

    const factory = await ethers.getContractFactory("SharedWallet");
    const sharedWallet = await factory.deploy(guardian.address, { value: ethers.parseEther("5") });
    await sharedWallet.waitForDeployment();

    const users = accounts.slice(3,6);

    return { sharedWallet, guardian, owner, users };
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
      const {sharedWallet, owner, users } = await loadFixture(deploySharedWallet);
  
      await sharedWallet.connect(owner).addBeneficiary(users[0].address, ethers.parseEther("1"), ethers.parseEther("1"))
      const [balance, limit, spent] = await sharedWallet.getBeneficiaryData(users[0].address);
      expect(balance).to.equal(ethers.parseEther("1"));
      expect(limit).to.equal(ethers.parseEther("1"));
      expect(spent).to.equal(0);
  
    });
  });

  describe("Transactions", function() {
    it("Should allow deposit and track balance", async function () {
      const {sharedWallet, owner } = await loadFixture(deploySharedWallet);
      await sharedWallet.connect(owner).deposit({value: ethers.parseEther("2")});
  
      const balance = await sharedWallet.walletBalance();
  
      expect(balance).to.equal(ethers.parseEther("7"))
      expect(balance).to.equal(await ethers.provider.getBalance(await sharedWallet.getAddress()));
    })
  
    it("Should allow withdrawal within daily limit", async function () {
      const {sharedWallet, owner, users } = await loadFixture(deploySharedWallet);
      await sharedWallet.connect(owner).addBeneficiary(users[0].address, ethers.parseEther("1"), ethers.parseEther("1"));
  
      const before = await ethers.provider.getBalance(users[0].address);

      const tx = await sharedWallet.connect(users[0]).withdraw(ethers.parseEther("0.5"));
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const after = await ethers.provider.getBalance(users[0].address);

      expect(after).to.be.closeTo(before + ethers.parseEther("0.5"),gasUsed);
    })

    it("Should prevent exceeding daily limit", async function () {
      const {sharedWallet, owner, users } = await loadFixture(deploySharedWallet);
      await sharedWallet.connect(owner).addBeneficiary(users[0].address, ethers.parseEther("1"), ethers.parseEther("0.5"));
      await sharedWallet.connect(users[0]).withdraw(ethers.parseEther("0.5"));
      await expect(sharedWallet.connect(users[0]).withdraw(ethers.parseEther("0.2"))).to.be.revertedWith("Daily limit exceeded");
    })

    it("Should allow transfer to another account", async function () {
      const {sharedWallet, owner, users } = await loadFixture(deploySharedWallet);
      await sharedWallet.connect(owner).addBeneficiary(users[0].address, ethers.parseEther("1"), ethers.parseEther("1"));

      const before = await ethers.provider.getBalance(users[1].address);
      const tx = await sharedWallet.connect(users[0]).transferTo(users[1].address, ethers.parseEther("0.25"));
      const receipt = await tx.wait();
      const after = await ethers.provider.getBalance(users[1].address);

      expect(after - before).to.equal(ethers.parseEther("0.25"));

      const event = receipt.logs.find(log => log.fragment?.name === "EtherTransferred");
      expect(event).to.exist;
      expect(event.args.from).to.equal(users[0].address);
      expect(event.args.to).to.equal(users[1].address);
      expect(event.args.amount).to.equal(ethers.parseEther("0.25"));
    })

    it("Should allow guardian to start and complete a successful election", async function () {
      const { sharedWallet, guardian, owner, users } = await loadFixture(deploySharedWallet);
  
      const candidate = users[0];
  
      // Owner adds 3 beneficiaries
      for (const b of users) {
        await sharedWallet.connect(owner).addBeneficiary(b.address, ethers.parseEther("1"), ethers.parseEther("1"));
      }
  
      // Guardian initiates election for candidate
      await sharedWallet.connect(guardian).startElection(candidate.address);
      let stage = await sharedWallet.getElectionStage();
      expect(stage).to.equal(1); // Voting in progress
  
      // Each beneficiary votes for the candidate
      for (const b of users) {
        await sharedWallet.connect(b).vote();
      }
  
      // Simulate 24 hours passing
      await network.provider.send("evm_increaseTime", [24 * 60 * 60]);
      await network.provider.send("evm_mine");
  
      // Guardian finalizes election
      await sharedWallet.connect(guardian).finalizeElection();
  
      expect(await sharedWallet.owner()).to.equal(candidate.address);
    });

    it("Election should fail if not enough votes", async function () {
      const { sharedWallet, guardian, owner, users } = await loadFixture(deploySharedWallet);
  
      const candidate = users[0];
  
      // Owner adds 3 beneficiaries
      for (const b of users) {
        await sharedWallet.connect(owner).addBeneficiary(b.address, ethers.parseEther("1"), ethers.parseEther("1"));
      }
  
      // Guardian initiates election for candidate
      await sharedWallet.connect(guardian).startElection(candidate.address);
      let stage = await sharedWallet.getElectionStage();
      expect(stage).to.equal(1); // Voting in progress
  
      // One beneficiary votes for the candidate
      await sharedWallet.connect(users[1]).vote();
  
      // Simulate 24 hours passing
      await network.provider.send("evm_increaseTime", [24 * 60 * 60]);
      await network.provider.send("evm_mine");
  
      // Guardian finalizes election
      await sharedWallet.connect(guardian).finalizeElection();
  
      expect(await sharedWallet.owner()).to.not.equal(candidate.address);
    })
  
  })
});