import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { Database } from 'firebase-firestore-lite';

// 加載 .env 文件中的環境變量
dotenv.config();

// 初始化 Firebase
const projectId = 'mntlhunter-e8455';
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
      const userDocRef = db.ref('users/' + address);
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
