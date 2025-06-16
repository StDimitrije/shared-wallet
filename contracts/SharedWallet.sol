// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SharedWallet is ReentrancyGuard {
    struct Transaction {
        uint timestamp;
        uint amount;
        address from;
        address to;
    }

    struct Beneficiary {
        uint totalBalance;
        uint limit;
        uint dailyBalance;
    }

    struct Wallet {
        address owner;
        uint numDeposits;
        uint numWithdrawals;
        mapping(uint => Transaction) depositHistory;
        mapping(uint => Transaction) withdrawalHistory;
        uint walletBalance;
        mapping(address => Beneficiary) beneficiaries;
    }

    Wallet private wallet;

    event EtherTransferred(
        address indexed from,
        address indexed to,
        uint256 amount
    );

    receive() external payable {
        deposit();
    }

    fallback() external payable {
        deposit();
    }

    modifier onlyOwner() {
        require(wallet.owner == msg.sender, "You are not the owner");
        _;
    }

    modifier insufficientBalance(address _beneficiary, uint _amount) {
        require(
            wallet.beneficiaries[_beneficiary].totalBalance >= _amount,
            "Insufficient ballance"
        );
        _;
    }

    modifier dailyLimit(address _beneficiary, uint _amount) {
        require(
            wallet.beneficiaries[_beneficiary].limit -
                wallet.beneficiaries[_beneficiary].dailyBalance >=
                _amount,
            "You have reached your daily transaction balance"
        );
        _;
    }

    modifier minimalAmount(uint _amount) {
        require(_amount > 0, "Amount must be greater than zero");
        _;
    }

    constructor() payable {
        wallet.owner = msg.sender;
        wallet.walletBalance = msg.value;
    }

    function addBeneficiary(
        address _address,
        uint _amount,
        uint _limit
    ) public onlyOwner {
        wallet.beneficiaries[_address].totalBalance += _amount;
        wallet.beneficiaries[_address].limit = _limit;
    }

    function increaseLimitBy(address _beneficiary, uint _amount) public {
        wallet.beneficiaries[_beneficiary].limit += _amount;
    }

    function addAllowanceToBeneficiary(
        address _to,
        uint _amount
    ) public onlyOwner {
        wallet.beneficiaries[_to].totalBalance += _amount;
    }

    function getWalletBalance() public view onlyOwner returns (uint) {
        return wallet.walletBalance;
    }

    function getBeneficiaryBalance(
        address _address
    ) public view returns (uint) {
        return wallet.beneficiaries[_address].totalBalance;
    }

    function getBeneficiaryLimit(address _address) public view returns (uint) {
        return wallet.beneficiaries[_address].limit;
    }

    // TODO add getter for Beneficiary daily balance

    function deposit() public payable {
        Transaction memory transaction = Transaction(
            block.timestamp,
            msg.value,
            msg.sender,
            address(this)
        );
        wallet.depositHistory[wallet.numDeposits] = transaction;
        wallet.walletBalance += msg.value;
        wallet.beneficiaries[msg.sender].totalBalance += msg.value;

        wallet.numDeposits++;
    }

    function withdraw(
        uint _amount
    )
        public
        insufficientBalance(msg.sender, _amount)
        dailyLimit(msg.sender, _amount)
        minimalAmount(_amount)
        nonReentrant
    {
        Transaction memory transaction = Transaction(
            block.timestamp,
            _amount,
            address(this),
            msg.sender
        );
        wallet.withdrawalHistory[wallet.numWithdrawals] = transaction;
        wallet.beneficiaries[msg.sender].totalBalance -= _amount;
        wallet.beneficiaries[msg.sender].dailyBalance += _amount;
        wallet.walletBalance -= _amount;

        wallet.numWithdrawals++;

        payable(msg.sender).transfer(_amount);

        emit EtherTransferred(msg.sender, msg.sender, _amount);
    }

    function transferTo(
        address payable _to,
        uint _amount
    )
        public
        insufficientBalance(msg.sender, _amount)
        dailyLimit(msg.sender, _amount)
        minimalAmount(_amount)
        nonReentrant
    {
        require(_to != address(0), "Invalid Recipient");
        Transaction memory transaction = Transaction(
            block.timestamp,
            _amount,
            msg.sender,
            _to
        );

        bool isContract = _to.code.length > 0;
        uint gasLimit = isContract ? 100000 : 2300;

        wallet.withdrawalHistory[wallet.numWithdrawals] = transaction;
        wallet.beneficiaries[msg.sender].totalBalance -= _amount;
        wallet.beneficiaries[msg.sender].dailyBalance += _amount;
        wallet.walletBalance -= _amount;

        wallet.numWithdrawals++;

        (bool success, ) = _to.call{value: _amount, gas: gasLimit}("");

        require(success, "Transfer failed");
        emit EtherTransferred(msg.sender, _to, _amount);
    }

    // TODO create transfer ownership feature
    function transferOwnership() public {}

    // TODO create limit reset feature
}
