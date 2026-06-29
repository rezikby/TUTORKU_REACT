import { generateKeyPairSync } from 'crypto';

const base64UrlEncode = (buffer) =>
  buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const keyPair = generateKeyPairSync('ec', {
  namedCurve: 'P-256',
});

const publicJwk = keyPair.publicKey.export({ format: 'jwk' });
const privateJwk = keyPair.privateKey.export({ format: 'jwk' });

const rawPublicKey = Buffer.concat([
  Buffer.from([4]),
  Buffer.from(publicJwk.x, 'base64url'),
  Buffer.from(publicJwk.y, 'base64url'),
]);

console.log('VAPID Public Key:');
console.log(base64UrlEncode(rawPublicKey));
console.log('\nVAPID Private Key:');
console.log(privateJwk.d);
console.log('\nCopy the public key into frontend/.env as VITE_FIREBASE_PUBLIC_KEY.');
