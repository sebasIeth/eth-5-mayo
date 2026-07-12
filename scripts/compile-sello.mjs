import fs from 'node:fs';
import path from 'node:path';
import solc from 'solc';
const root = process.cwd();
const src = fs.readFileSync(path.join(root,'contracts/SelloRegistry.sol'),'utf8');
const input = {
  language: 'Solidity',
  sources: { 'SelloRegistry.sol': { content: src } },
  settings: { optimizer: { enabled: true, runs: 200 }, outputSelection: { '*': { '*': ['abi','evm.bytecode.object'] } } },
};
const out = JSON.parse(solc.compile(JSON.stringify(input)));
if (out.errors) {
  const fatal = out.errors.filter(e=>e.severity==='error');
  out.errors.forEach(e=>console.log(e.formattedMessage));
  if (fatal.length) process.exit(1);
}
const c = out.contracts['SelloRegistry.sol']['SelloRegistry'];
fs.writeFileSync(path.join(root,'contracts/SelloRegistry.json'), JSON.stringify({ abi: c.abi, bytecode: '0x'+c.evm.bytecode.object }, null, 2));
console.log('OK: abi entries', c.abi.length, 'bytecode bytes', c.evm.bytecode.object.length/2);
