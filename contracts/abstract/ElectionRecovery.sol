// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../structs/Election.sol";
import "./BeneficiaryManager.sol";

abstract contract ElectionRecovery is BeneficiaryManager {
    enum ElectionStage {
        Init,
        InProgress,
        Ended
    }

    Election private election;
    ElectionStage public stage;

    event ElectionStarted(address indexed candidate);
    event Voted(address indexed voted);
    event ElectionEndedSuccessfully(address winner);
    event ElectionFailed(address candidate);

    function startElection(address _candidate) external onlyRecoveryGuardian {
        require(
            stage != ElectionStage.InProgress,
            "Election already in progress"
        );
        require(_candidate != address(0), "Invalid candidate");

        stage = ElectionStage.InProgress;
        election.candidate = _candidate;
        election.votes = 0;
        election.startTime = block.timestamp;

        emit ElectionStarted(_candidate);
    }

    function vote() external onlyBeneficiary {
        require(stage == ElectionStage.InProgress, "No active election");
        require(!election.hasVoted[msg.sender], "You have already voted");

        election.votes++;
        election.hasVoted[msg.sender] = true;

        emit Voted(msg.sender);
    }

    function finalizeElection() external onlyRecoveryGuardian {
        require(stage == ElectionStage.InProgress, "No election to finalize");
        require(
            block.timestamp >= election.startTime + 1 days,
            "Election still in progress"
        );

        uint totalVoters = beneficiariesList.length;
        uint threshold = (totalVoters * 51) / 100;

        if (election.votes > threshold) {
            _transferOwnership(election.candidate);
            emit ElectionEndedSuccessfully(election.candidate);
        } else {
            emit ElectionFailed(election.candidate);
        }

        stage = ElectionStage.Ended;
        delete election;
    }

    function getElectedCandidate() external view returns (address candidate) {
        return election.candidate;
    }

    function getElectionStage() external view returns (uint8) {
        return uint8(stage);
    }
}
