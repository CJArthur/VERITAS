"""
Blockchain anchoring service — Sepolia testnet via web3.py.

Anchors diploma data_hash to the VeritasAnchor smart contract.
If SEPOLIA_RPC_URL / CONTRACT_ADDRESS env vars are not set, all
methods degrade gracefully and return "not_configured" status.

Usage:
    svc = BlockchainService()
    if svc.is_configured():
        tx_hash = await svc.anchor("abc123...")
        result  = await svc.verify_hash("abc123...")
"""
from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from typing import Optional

log = logging.getLogger(__name__)

# Minimal ABI — only the two functions we use
_VERITAS_ABI = [
    {
        "inputs": [{"internalType": "bytes32", "name": "dataHash", "type": "bytes32"}],
        "name": "anchor",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "bytes32", "name": "dataHash", "type": "bytes32"}],
        "name": "verify",
        "outputs": [
            {"internalType": "bool", "name": "exists", "type": "bool"},
            {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
            {"internalType": "address", "name": "issuer", "type": "address"},
        ],
        "stateMutability": "view",
        "type": "function",
    },
]


@dataclass
class BlockchainVerifyResult:
    status: str          # "anchored" | "pending" | "mismatch" | "not_configured"
    tx_hash: Optional[str] = None
    anchored_at: Optional[int] = None    # unix timestamp from chain
    network: str = "sepolia"


class BlockchainService:
    def __init__(self) -> None:
        from app.settings import SETTINGS
        self._rpc_url = SETTINGS.SEPOLIA_RPC_URL
        self._private_key = SETTINGS.DEPLOYER_PRIVATE_KEY
        self._contract_address = SETTINGS.CONTRACT_ADDRESS

    def is_configured(self) -> bool:
        return bool(self._rpc_url and self._private_key and self._contract_address)

    def _get_web3(self):
        """Lazy Web3 import — web3 is optional dep; only imported if configured."""
        from web3 import Web3
        w3 = Web3(Web3.HTTPProvider(self._rpc_url))
        if not w3.is_connected():
            raise RuntimeError("Cannot connect to Sepolia RPC")
        return w3

    def _hash_bytes(self, data_hash_hex: str) -> bytes:
        """Convert 64-char hex string to bytes32."""
        return bytes.fromhex(data_hash_hex)

    async def anchor(self, data_hash_hex: str) -> str:
        """
        Send anchor transaction. Returns tx_hash string.
        Runs in executor to avoid blocking the event loop.
        """
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, self._anchor_sync, data_hash_hex)

    def _anchor_sync(self, data_hash_hex: str) -> str:
        from web3 import Web3
        w3 = self._get_web3()
        account = w3.eth.account.from_key(self._private_key)
        contract = w3.eth.contract(
            address=Web3.to_checksum_address(self._contract_address),
            abi=_VERITAS_ABI,
        )
        hash_bytes = self._hash_bytes(data_hash_hex)
        nonce = w3.eth.get_transaction_count(account.address)
        tx = contract.functions.anchor(hash_bytes).build_transaction({
            "from": account.address,
            "nonce": nonce,
            "gas": 80_000,
            "gasPrice": w3.eth.gas_price,
        })
        signed = w3.eth.account.sign_transaction(tx, self._private_key)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        # Wait for 1 confirmation
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
        if receipt.status != 1:
            raise RuntimeError(f"Transaction failed: {tx_hash.hex()}")
        return tx_hash.hex()

    async def verify_hash(self, data_hash_hex: str) -> BlockchainVerifyResult:
        """Check if hash is anchored on chain."""
        if not self.is_configured():
            return BlockchainVerifyResult(status="not_configured")
        loop = asyncio.get_running_loop()
        try:
            return await loop.run_in_executor(None, self._verify_sync, data_hash_hex)
        except Exception as exc:
            log.warning("Blockchain verify failed: %s", exc)
            return BlockchainVerifyResult(status="pending")

    def _verify_sync(self, data_hash_hex: str) -> BlockchainVerifyResult:
        from web3 import Web3
        w3 = self._get_web3()
        contract = w3.eth.contract(
            address=Web3.to_checksum_address(self._contract_address),
            abi=_VERITAS_ABI,
        )
        hash_bytes = self._hash_bytes(data_hash_hex)
        exists, timestamp, _ = contract.functions.verify(hash_bytes).call()
        if not exists:
            return BlockchainVerifyResult(status="pending")
        return BlockchainVerifyResult(
            status="anchored",
            anchored_at=timestamp,
        )


# Module-level singleton — instantiated once, reused per request
blockchain_service = BlockchainService()
