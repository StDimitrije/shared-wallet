// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./structs/Beneficiary.sol";
import "./structs/Transaction.sol";

abstract contract BeneficiaryManager {
    mapping(address => Beneficiary) internal beneficiaries;
    uint256 internal totalAllocated;

    modifier hasSufficientBalance(address _beneficiary, uint _amount) {
        require(
            beneficiaries[_beneficiary].totalBalance >= _amount,
            "Insufficient ballance"
        );
        _;
    }

    modifier dailyLimit(address _beneficiary, uint _amount) {
        _resetDailySpentIfNeeded(_beneficiary);
        require(
            beneficiaries[_beneficiary].dailyBalance + _amount <=
                beneficiaries[_beneficiary].limit,
            "Transaction exceeds your daily limit"
        );
        _;
    }

    function _resetDailySpentIfNeeded(address _beneficiary) internal {
        Beneficiary storage beneficiary = beneficiaries[_beneficiary]; //returns a reference to storage, not a copy.
        if (block.timestamp - beneficiary.lastReset >= 1 days) {
            beneficiary.dailyBalance = 0;
            beneficiary.lastReset = block.timestamp;
        }
    }

    function _addBeneficiary(address addr, uint amount, uint limit) public {
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

    function _increaseLimitBy(address _beneficiary, uint _amount) public {
        beneficiaries[_beneficiary].limit += _amount;
    }

    function _decreaseLimitBy(address _beneficiary, uint _amount) public {
        beneficiaries[_beneficiary].limit -= _amount;
    }

    function _addAllowanceToBeneficiary(address _to, uint _amount) public {
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
}
