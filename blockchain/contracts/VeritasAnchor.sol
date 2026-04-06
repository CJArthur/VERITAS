// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VeritasAnchor {
    struct Anchor {
        bytes32 dataHash;
        uint256 timestamp;
        address issuer;
    }

    mapping(bytes32 => Anchor) public anchors;

    event DiplomaAnchored(
        bytes32 indexed dataHash,
        address indexed issuer,
        uint256 timestamp
    );

    function anchor(bytes32 dataHash) external {
        require(anchors[dataHash].timestamp == 0, "Already anchored");
        anchors[dataHash] = Anchor(dataHash, block.timestamp, msg.sender);
        emit DiplomaAnchored(dataHash, msg.sender, block.timestamp);
    }

    function verify(bytes32 dataHash)
        external view
        returns (bool exists, uint256 timestamp, address issuer)
    {
        Anchor memory a = anchors[dataHash];
        return (a.timestamp != 0, a.timestamp, a.issuer);
    }
}
