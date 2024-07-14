import BN from 'bn.js';

const v = '0x86ea91e266287d11011f5c0b3963d2ea';
const b = new BN(v.substring(2), 'hex');
console.log(b.toString(10));
