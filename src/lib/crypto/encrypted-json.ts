type EncryptedFileV1 = {
    v: 1;
    alg: 'AES-256-GCM';
    kdf: 'PBKDF2';
    hash: 'SHA-256';
    iterations: number;
    salt: string;
    iv: string;
    data: string;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64ToBytes(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
}

async function deriveKey(passphrase: string, salt: Uint8Array, iterations: number) {
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(passphrase),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations,
            hash: 'SHA-256'
        },
        keyMaterial,
        {
            name: 'AES-GCM',
            length: 256
        },
        false,
        ['decrypt']
    );
}

export async function fetchEncryptedJson<T>(url: string, passphrase: string): Promise<T> {
    const res = await fetch(url, { cache: 'no-store' });

    if (!res.ok) {
        throw new Error(`Failed to fetch ${url}: ${res.status}`);
    }

    const file = (await res.json()) as EncryptedFileV1;

    if (file.v !== 1 || file.alg !== 'AES-256-GCM' || file.kdf !== 'PBKDF2') {
        throw new Error('Unsupported encrypted file format');
    }

    const salt = base64ToBytes(file.salt);
    const iv = base64ToBytes(file.iv);
    const data = base64ToBytes(file.data);

    const key = await deriveKey(passphrase, salt, file.iterations);

    let plaintext: ArrayBuffer;

    try {
        plaintext = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv
            },
            key,
            data
        );
    } catch {
        throw new Error('Wrong passcode or corrupt encrypted file');
    }

    return JSON.parse(decoder.decode(plaintext)) as T;
}