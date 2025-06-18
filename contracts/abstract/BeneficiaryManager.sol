// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../structs/Beneficiary.sol";

/**
 * @title BeneficiaryManager
 * Handles allowances and tracking of beneficiaries
 */
abstract contract BeneficiaryManager {
    mapping(address => Beneficiary) internal beneficiaries;
    uint256 internal totalAllocated;

    modifier checkAllowance(address _beneficiary, uint _amount) {
        Beneficiary storage b = beneficiaries[_beneficiary];
        _resetDailySpentIfNeeded(_beneficiary);
        require(b.totalBalance >= _amount, "Insufficient allowance");
        require(b.dailyBalance + _amount <= b.limit, "Daily limit exceeded");
        _;
    }

    function _resetDailySpentIfNeeded(address _beneficiary) internal {
        Beneficiary storage b = beneficiaries[_beneficiary]; //returns a reference to storage, not a copy.
        if (block.timestamp - b.lastReset >= 1 days) {
            b.dailyBalance = 0;
            b.lastReset = block.timestamp;
        }
    }

    function _addBeneficiary(address addr, uint amount, uint limit) internal {
        require(
            totalAllocated + amount <= address(this).balance,
            "Insufficient wallet balance"
        );

        Beneficiary storage b = beneficiaries[addr];
        b.totalBalance += amount;
        b.limit = limit;
        b.lastReset = block.timestamp;

        totalAllocated += amount;
    }

    function _increaseLimitBy(address _beneficiary, uint _amount) internal {
        beneficiaries[_beneficiary].limit += _amount;
    }

    function _decreaseLimitBy(address _beneficiary, uint _amount) internal {
        beneficiaries[_beneficiary].limit -= _amount;
    }

    function _setNewLimit(address _beneficiary, uint _amount) internal {
        beneficiaries[_beneficiary].limit = _amount;
    }

    function _addAllowanceToBeneficiary(address _to, uint _amount) internal {
        require(
            totalAllocated + _amount <= address(this).balance,
            "Insufficient wallet balance"
        );

        beneficiaries[_to].totalBalance += _amount;
        totalAllocated += _amount;
    }

    function _spendEther(address beneficiary, uint _amount) internal {
        Beneficiary storage b = beneficiaries[beneficiary];
        b.totalBalance -= _amount;
        b.dailyBalance += _amount;
        totalAllocated -= _amount;
    }

    function getBeneficiaryData(
        address user
    )
        external
        view
        returns (uint256 balance, uint256 limit, uint256 dailySpent)
    {
        Beneficiary storage b = beneficiaries[user];
        return (b.totalBalance, b.limit, b.dailyBalance);
    }
}
