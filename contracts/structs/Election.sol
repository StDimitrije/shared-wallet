// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

struct Election {
    address candidate;
    uint votes;
    uint startTime;
    mapping(address => bool) hasVoted;
}
