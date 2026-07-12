import fs from "node:fs";
import path from "node:path";
import { ethers } from "ethers";

// Registro on-chain del Sello (Sepolia). El gas lo paga el relayer de la
// plataforma (patrocinado); el establecimiento no necesita wallet.
// Config por entorno:
//   SEPOLIA_RPC_URL          RPC de Sepolia (Alchemy/Infura/público)
//   RELAYER_PRIVATE_KEY      llave privada de la wallet que paga el gas
//   SELLO_CONTRACT_ADDRESS   dirección del contrato SelloRegistry desplegado
const RPC = process.env.SEPOLIA_RPC_URL || "";
const KEY = process.env.RELAYER_PRIVATE_KEY || "";
const ADDRESS = process.env.SELLO_CONTRACT_ADDRESS || "";

export const blockchainConfigurado = () =>
  RPC.length > 0 && KEY.length > 0 && ADDRESS.length > 0;

let abiCache: unknown[] | null = null;
function abi(): unknown[] {
  if (abiCache) return abiCache;
  const p = path.join(process.cwd(), "contracts", "SelloRegistry.json");
  abiCache = JSON.parse(fs.readFileSync(p, "utf8")).abi;
  return abiCache!;
}

// id determinista a partir del id interno del registro.
export function selloId(registroId: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(`sello:${registroId}`));
}

type Datos = {
  registroId: string;
  empresa: string;
  giro: string;
  consultor: string;
};

export type ResultadoBlockchain = {
  txHash: string;
  id: string;
  url: string;
  contrato: string;
};

// Graba el sello en la blockchain. Devuelve null si no está configurado o si
// falla (nunca lanza: el flujo de negocio no debe romperse por la blockchain).
export async function registrarSelloEnBlockchain(
  d: Datos,
): Promise<ResultadoBlockchain | null> {
  if (!blockchainConfigurado()) return null;
  try {
    const provider = new ethers.JsonRpcProvider(RPC);
    const wallet = new ethers.Wallet(KEY, provider);
    const contract = new ethers.Contract(ADDRESS, abi() as ethers.InterfaceAbi, wallet);

    const id = selloId(d.registroId);
    const datosHash = ethers.keccak256(
      ethers.toUtf8Bytes(`${d.empresa}|${d.giro}|${d.consultor}`),
    );

    const tx = await contract.registrar(
      id,
      d.empresa || "",
      d.giro || "",
      d.consultor || "",
      datosHash,
    );
    await tx.wait(1);

    return {
      txHash: tx.hash,
      id,
      contrato: ADDRESS,
      url: `https://sepolia.etherscan.io/tx/${tx.hash}`,
    };
  } catch (err) {
    console.error("[blockchain] error al registrar el sello:", err);
    return null;
  }
}
