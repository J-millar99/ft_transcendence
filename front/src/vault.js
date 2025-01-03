import axios from 'axios';

const VAULT_ADDR = "https://localhost:443"; // Vault 서버 주소
const DJANGO_API_URL = "http://localhost:8000/api/vault/"; // Django API URL

/**
 * Django API에서 role-id와 secret-id 가져오기
 */
async function fetchVaultData() {
    try {
        const response = await axios.get(DJANGO_API_URL);
        return response.data; // { role_id, secret_id } 반환
    } catch (error) {
        console.error("Failed to fetch Vault data from Django API:", error.message);
        throw error;
    }
}

/**
 * Vault에서 AppRole 로그인 토큰 가져오기
 */
export async function getVaultToken() {
    try {
        // Django API에서 role-id와 secret-id 가져오기
        const { role_id, secret_id } = await fetchVaultData();

        console.log("Role ID (from API):", role_id);
        console.log("Secret ID (from API):", secret_id);

        // Vault 서버에 로그인 요청
        const response = await axios.post(`${VAULT_ADDR}/v1/auth/approle/login`, {
            role_id,
            secret_id,
        });

        return response.data.auth.client_token; // Vault 토큰 반환
    } catch (error) {
        console.error("Failed to get Vault token:", error.message);
        throw error;
    }
}

/**
 * Vault에서 특정 경로의 비밀값 가져오기
 * @param {string} secretPath - 비밀값이 저장된 Vault의 경로
 */
export async function getSecretValue(secretPath) {
    try {
        const token = await getVaultToken();

        // Vault에서 비밀값 가져오기
        const response = await axios.get(`${VAULT_ADDR}/v1/transcendence/data/${secretPath}`, {
            headers: { "X-Vault-Token": token },
        });

        return response.data.data.data.envvalue; // 비밀값 반환
    } catch (error) {
        console.error("Failed to get secret value:", error.message);
        throw error;
    }
}


// async function getVaultToken() {
//     // Role ID와 Secret ID 읽기
//     const roleId = JSON.parse(fs.readFileSync(ROLE_ID_FILE, 'utf-8')).data.role_id;
//     const secretId = JSON.parse(fs.readFileSync(SECRET_ID_FILE, 'utf-8')).data.secret_id;

//     try {
//         const response = await axios.post(`${VAULT_ADDR}/v1/auth/approle/login`, {
//             role_id: roleId,
//             secret_id: secretId
//         });
//         return response.data.auth.client_token;
//     } catch (error) {
//         console.error('Failed to get Vault token:', error);
//         throw error;
//     }
// }

// // Vault에서 비밀 읽기
// async function getSecretValue(secretPath) {
//     try {
//         const token = await getVaultToken();
//         const response = await axios.get(`${VAULT_ADDR}/v1/transcendence/data/${secretPath}`, {
//             headers: { 'X-Vault-Token': token }
//         });
//         return response.data.data.data.envvalue;
//     } catch (error) {
//         console.error('Failed to get secret value:', error);
//         throw error;
//     }
// }

// module.exports = { getVaultToken, getSecretValue };
