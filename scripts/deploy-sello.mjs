// Despliega SelloRegistry a la red configurada (por defecto Sepolia).
// Uso: node scripts/deploy-sello.mjs
// Requiere en el entorno: SEPOLIA_RPC_URL y RELAYER_PRIVATE_KEY (wallet con
// algo de Sepolia ETH de faucet). Imprime la dirección del contrato.
import fs from "node:fs";
import path from "node:path";
import { ethers } from "ethers";

const RPC = process.env.SEPOLIA_RPC_URL;
const KEY = process.env.RELAYER_PRIVATE_KEY;
if (!RPC || !KEY) {
  console.error("Falta SEPOLIA_RPC_URL o RELAYER_PRIVATE_KEY en el entorno.");
  process.exit(1);
}

const artifact = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "contracts/SelloRegistry.json"), "utf8"),
);

const provider = new ethers.JsonRpcProvider(RPC);
const wallet = new ethers.Wallet(KEY, provider);

console.log("Relayer:", wallet.address);
const bal = await provider.getBalance(wallet.address);
console.log("Balance:", ethers.formatEther(bal), "ETH");
if (bal === 0n) {
  console.error("La wallet no tiene Sepolia ETH. Fondéala en un faucet y reintenta.");
  process.exit(1);
}

const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
console.log("Desplegando SelloRegistry…");
const contract = await factory.deploy();
await contract.waitForDeployment();
const address = await contract.getAddress();
console.log("\n✅ SelloRegistry desplegado en:", address);
console.log("Etherscan:", `https://sepolia.etherscan.io/address/${address}`);
console.log("\nAgrega a .env.local y a Vercel:");
console.log(`SELLO_CONTRACT_ADDRESS="${address}"`);
