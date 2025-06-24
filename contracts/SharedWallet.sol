// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";
import "./abstract/ElectionRecovery.sol";

/**
 * @title SharedWallet
 * Full Wallet Impplementation - Combines WalletBase + BeneficiaryManager with emergency ownership recovery
 */
contract SharedWallet is ElectionRecovery {
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

    constructor(
        address recoveryGuardian_
    ) payable WalletBase(recoveryGuardian_) {
        walletBalance = msg.value;
        // _addBeneficiary(msg.sender, msg.value, msg.value * 1e18 * 3);
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
        external
        checkAllowance(msg.sender, _amount)
        minimalAmount(_amount)
        onlyValidRecipient(msg.sender)
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
        checkAllowance(msg.sender, _amount)
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

    // Admin Actions
    function addBeneficiary(
        address _addr,
        uint256 _amount,
        uint256 _limit
    ) external onlyOwner {
        _addBeneficiary(_addr, _amount, _limit);
    }

    function increaseLimitBy(
        address _addr,
        uint256 _amount
    ) external onlyOwner {
        _increaseLimitBy(_addr, _amount);
    }

    function decreaseLimitBy(
        address _addr,
        uint256 _amount
    ) external onlyOwner {
        _decreaseLimitBy(_addr, _amount);
    }

    function setNewLimit(address _addr, uint256 _amount) external onlyOwner {
        _setNewLimit(_addr, _amount);
    }

    function addAllowance(address _addr, uint256 _amount) external onlyOwner {
        _addAllowanceToBeneficiary(_addr, _amount);
    }
}
