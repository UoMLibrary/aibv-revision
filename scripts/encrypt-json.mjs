import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createCipheriv, pbkdf2Sync, randomBytes } from 'node:crypto';

const SOURCE_DIR = 'private-json';
const OUTPUT_DIR = 'static/encrypted';
const PASSPHRASE = process.env.JSON_PASSPHRASE;

const ITERATIONS = 250_000; // tune for your audience/devices

if (!PASSPHRASE) {
	console.error('Missing JSON_PASSPHRASE environment variable');
	process.exit(1);
}

function encryptBuffer(buffer, passphrase) {
	const salt = randomBytes(16);
	const iv = randomBytes(12); // standard AES-GCM IV size
	const key = pbkdf2Sync(passphrase, salt, ITERATIONS, 32, 'sha256');

	const cipher = createCipheriv('aes-256-gcm', key, iv);
	const ciphertext = Buffer.concat([cipher.update(buffer), cipher.final()]);
	const authTag = cipher.getAuthTag();

	key.fill(0);

	return {
		v: 1,
		alg: 'AES-256-GCM',
		kdf: 'PBKDF2',
		hash: 'SHA-256',
		iterations: ITERATIONS,
		salt: salt.toString('base64'),
		iv: iv.toString('base64'),
		data: Buffer.concat([ciphertext, authTag]).toString('base64')
	};
}

async function main() {
	await mkdir(OUTPUT_DIR, { recursive: true });

	const files = await readdir(SOURCE_DIR);

	for (const file of files) {
		if (!file.endsWith('.json')) continue;

		const inputPath = join(SOURCE_DIR, file);
		const outputPath = join(OUTPUT_DIR, file.replace(/\.json$/, '.enc.json'));

		const plaintext = await readFile(inputPath);
		const envelope = encryptBuffer(plaintext, PASSPHRASE);

		await writeFile(outputPath, JSON.stringify(envelope, null, 2), 'utf8');
		console.log(`Encrypted ${file} -> ${outputPath}`);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
