// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

struct Beneficiary {
    uint totalBalance;
    uint limit;
    uint dailyBalance;
    uint lastReset;
    bool exists;
}
