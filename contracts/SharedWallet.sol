// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./structs/Beneficiary.sol";
import "./structs/Transaction.sol";
import "./abstract/WalletBase.sol";
import "./abstract/BeneficiaryManager.sol";

contract SharedWallet is
    WalletBase,
    BeneficiaryManager,
    ReentrancyGuard,
    Ownable
{
    receive() external payable {
        deposit();
    }

    fallback() external payable {
        deposit();
    }

    constructor() payable Ownable(msg.sender) {
        _transferOwnership(msg.sender);
        walletBalance = msg.value;
    }

    function deposit() public payable {
        _recordTransaction(
            depositHistory,
            numDeposits,
            msg.sender,
            address(this),
            msg.value
        );
        walletBalance += msg.value;
        numDeposits++;
    }

    function withdraw(
        uint _amount
    )
        public
        hasSufficientBalance(msg.sender, _amount)
        dailyLimit(msg.sender, _amount)
        minimalAmount(_amount)
        nonReentrant
    {
        _recordTransaction(
            withdrawalHistory,
            numWithdrawals,
            address(this),
            msg.sender,
            _amount
        );

        _spendEther(msg.sender, _amount);
        walletBalance -= _amount;
        numWithdrawals++;

        payable(msg.sender).transfer(_amount);

        emit EtherTransferred(address(this), msg.sender, _amount);
    }

    function transferTo(
        address payable _to,
        uint _amount
    )
        external
        nonReentrant
        onlyValidRecipient(_to)
        hasSufficientBalance(msg.sender, _amount)
        dailyLimit(msg.sender, _amount)
        minimalAmount(_amount)
    {
        _recordTransaction(
            withdrawalHistory,
            numWithdrawals,
            msg.sender,
            _to,
            _amount
        );

        bool isContract = _to.code.length > 0;
        uint gasLimit = isContract ? 100_000 : 2_300;

        _spendEther(msg.sender, _amount);
        walletBalance -= _amount;
        numWithdrawals++;

        (bool success, ) = _to.call{value: _amount, gas: gasLimit}("");
        require(success, "Transfer failed");

        emit EtherTransferred(msg.sender, _to, _amount);
    }

    // TODO abstract _recordTransaction() and _spendEther() to eliminate duplicate code
    // function handleTransaction(
    //     mapping(uint => Transaction) storage _history,
    //     uint _counter,
    //     address _from,
    //     address _to,
    //     uint _amount
    // ) private {
    //     _recordTransaction(_history, _counter, _from, _to, _amount);
    //     _spendEther(_from, _amount);

    //     walletBalance -= _amount;
    //     numWithdrawals++;
    // }

    function getBeneficiaryInfo(
        address _addr
    )
        public
        view
        returns (uint256 balance, uint256 limit, uint256 dailyBalance)
    {
        Beneficiary memory b = beneficiaries[_addr];
        return (b.totalBalance, b.limit, b.dailyBalance);
    }

    // Admin Actions
    function addBeneficiary(
        address _addr,
        uint256 _amount,
        uint256 _limit
    ) public onlyOwner {
        _addBeneficiary(_addr, _amount, _limit);
    }

    function increaseLimitBy(address _addr, uint256 _amount) public onlyOwner {
        _increaseLimitBy(_addr, _amount);
    }

    function decreaseLimitBy(address _addr, uint256 _amount) public onlyOwner {
        _decreaseLimitBy(_addr, _amount);
    }

    function setNewLimit(address _addr, uint256 _amount) public onlyOwner {
        _setNewLimit(_addr, _amount);
    }

    function addAllowance(address _addr, uint256 _amount) public onlyOwner {
        _addAllowanceToBeneficiary(_addr, _amount);
    }

    function getWalletBalance()
        public
        view
        onlyOwner
        returns (uint256 contractBalance, uint256 walletBalance)
    {
        return (address(this).balance, walletBalance);
    }

    // TODO create transfer ownership feature
}
