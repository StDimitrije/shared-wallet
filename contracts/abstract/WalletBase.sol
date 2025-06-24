// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../structs/Transaction.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title WalletBase
 * Handles core wallet operations and transaction tracking
 */
abstract contract WalletBase is Ownable2Step, ReentrancyGuard {
    address public recoveryGuardian;
    uint public walletBalance;
    uint public numDeposits;
    uint public numWithdrawals;
    mapping(uint => Transaction) public depositHistory;
    mapping(uint => Transaction) public withdrawalHistory;

    modifier minimalAmount(uint _amount) {
        require(_amount > 0, "Amount must be greater than zero");
        _;
    }

    modifier onlyValidRecipient(address _recipient) {
        require(_recipient != address(0), "Invalid recipient");
        _;
    }

    modifier onlyRecoveryGuardian() {
        require(
            recoveryGuardian == msg.sender,
            "You are not the recovery guardian"
        );
        _;
    }

    constructor(address _recoveryGuardian) Ownable(msg.sender) {
        require(_recoveryGuardian != address(0), "Invalid guardian address");
        recoveryGuardian = _recoveryGuardian;
    }

    function updateRecoveryGuardian(address _guardian) external onlyOwner {
        recoveryGuardian = _guardian;
    }

    function emergencyTransferOwnership() external onlyRecoveryGuardian {
        _transferOwnership(msg.sender);
    }

    function _recordTransaction(
        mapping(uint256 => Transaction) storage history, //expects a storage reference and modifies it in-place.
        uint256 counter,
        address from,
        address to,
        uint256 amount
    ) internal {
        history[counter] = Transaction(block.timestamp, amount, from, to);
    }
}
