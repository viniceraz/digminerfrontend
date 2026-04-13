export const MINERPOOL_ABI = [
  "function deposit(uint256 amount) external",
  "function withdraw(uint256 amount, uint256 deadline, bytes signature) external",
  "function poolBalance() external view returns (uint256)",
  "function getNonce(address player) external view returns (uint256)",
  "event Deposited(address indexed player, uint256 amount, uint256 timestamp)",
  "event Withdrawn(address indexed player, uint256 amount, uint256 fee, uint256 nonce, uint256 timestamp)",
];

export const PATHUSD_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
];

export const CONTRACTS = {
  POOL: "0xb448796cab0FF8496e2DAF7c47589C349d14dDD9",
  PATHUSD: "0x20c0000000000000000000000000000000000000",
};
