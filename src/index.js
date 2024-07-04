import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { Database } from 'firebase-firestore-lite';

// 加載 .env 文件中的環境變量
dotenv.config();

// Firebase 配置
const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_ID
};

const fireWorkersConfig = {
  uid: process.env.UID,
  project_id: process.env.PROJECT_ID,
  client_email: process.env.CLIENT_EMAIL,
  private_key: process.env.PRIVATE_KEY,
  private_key_id: process.env.PRIVATE_KEY_ID
};

// 初始化 Firebase
const projectId = 'mntlhunter-e8455';
if (!projectId) {
	throw new Error('Invalid projectId. Please check your .env file.');
  }
const db = new Database({ projectId: projectId });

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  if (request.method !== 'POST') {
    return new Response('Only POST requests are allowed', { status: 405 });
  }

  const { signature, message, address } = await request.json();

  // 驗證簽名
  if (verifySignature(signature, message, address)) {
    try {
		console.log("000")
      const userDocRef = db.ref('users/' + address);
	  console.log("11111")
	  console.log(userDocRef)
	  try{
		const userDoc = await userDocRef.get();
		if (userDoc) {
			console.log(userDoc)
			return new Response(JSON.stringify(userDoc), { status: 200, headers: { 'Content-Type': 'application/json' } });
		}
	  }catch (error){
		await userDocRef.set({
			address: address,
			createdAt: new Date().toISOString(),
		  });
		  return new Response('User created', { status: 201 });
	  }
    } catch (error) {
      return new Response(`Error accessing Firestore: ${error.message}`, { status: 500 });
    }
  } else {
    return new Response('Invalid signature', { status: 401 });
  }
}

function verifySignature(signature, message, address) {
  try {
    const signerAddress = ethers.verifyMessage(message, signature);
    return signerAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.log(error);
    return false;
  }
}
