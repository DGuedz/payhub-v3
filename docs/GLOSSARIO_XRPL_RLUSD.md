# Glossary — XRPL & RLUSD (EN)

- XRPL (XRP Ledger): Layer-1 blockchain optimized for payments; 3–5s settlement, low fees.
- XRP: Native XRPL currency used for fees and liquidity; not an IOU.
- Issued Currency (IOU): Token issued by a gateway on XRPL requiring trustlines (e.g., RLUSD).
- RLUSD (Ripple USD): Stablecoin IOU targeting 1:1 USD parity; requires a trustline with the issuer.
- Trustline: A bilateral link between accounts and issuers enabling holding a specific IOU.
- Escrow: XRPL native conditional payment. `EscrowCreate` locks funds; `EscrowFinish` releases on condition.
- AMM: Automated Market Maker on XRPL for liquidity provisioning and swaps using LP positions.
- D+0: Same-day settlement (instant in XRPL context) vs D+30–D+60 traditional banking delays.
- ODL (On-Demand Liquidity): Liquidity provision model enabling instant settlement without pre-funding.
- RWA (Real World Asset): Tokenized representation of real-world receivables/assets for DeFi collateral.
- XLS-20: XRPL standard for NFTs (NFTokens) supporting mint/burn/transfer with metadata.
- Xumm: XRPL-native wallet app enabling XRPL transactions and account management.
- MetaMask: Popular EVM wallet; used with XRPL EVM sidechains for DeFi modules.
- WalletConnect: Protocol for connecting dApps and wallets; multi-wallet support across ecosystems.
- mXRP: Wrapped/bridged XRP representation for EVM sidechains.
- Payment Channel: XRPL primitive for high-throughput off-ledger micro-payments with on-ledger settlement.
- Memo: Optional metadata field attached to XRPL transactions for audit trails.
- Sequence: XRPL account transaction index ensuring ordering and preventing replay.
- Fee (Drops): XRPL fees are paid in drops (1 XRP = 1,000,000 drops); dynamic based on network load.
- Clawback: Issuer ability (for certain IOUs) to reclaim tokens under defined policies (compliance contexts).
- Freeze: Issuer ability to freeze IOUs affecting specific accounts or global issuance under policy.
- Multi-Sig: Multi-signature requirement for transactions; improves governance and security.
- Hooks (Research): XRPL feature proposal enabling small scripts on-ledger for conditional logic.
- Sidechain (XRPL EVM): EVM-compatible XRPL networks enabling smart contracts and DeFi strategies.
- Rippling: IOU balance propagation when `rippling` is allowed; relevant for pathfinding.
- Pathfinding: XRPL routing for payments across trustlines and order books to optimize settlement.
- Order Book: XRPL built-in DEX order books enabling cross-currency swaps via offers.
- Bridge (Interledger): Protocols or gateways connecting XRPL to other networks for cross-ledger transfers.

## Quick Notes & Examples
- Trustline Example: Create a trustline to issuer `rIssuer...` for RLUSD using `XRPL.js`.
- Escrow Flow: Use `EscrowCreate` to lock RLUSD upon purchase; release via `EscrowFinish` after service proof.
- AMM Yield: Provide liquidity to an RLUSD/XRP pool; receive LP tokens and yield.

## References
- XRPL Docs: https://xrpl.org/
- AMM Overview: https://xrpl.org/amm-overview.html
- Issued Currencies: https://xrpl.org/issued-currencies-overview.html
- NFTokens (XLS-20): https://xrpl.org/nftoken.html
