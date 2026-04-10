import { performLogin, fetchWithRetry, createToiClient } from './src/toiClient';
async function test() {
  try {
     const c = await performLogin('69toizero03261', '69toizero03261'); // guessing based on screenshot
     console.log("Logged in cookie:", c);
     const client = createToiClient(c);
     const r = await fetchWithRetry(client, '/00-pre-toi');
     console.log("HTML length:", r.data.length);
  } catch(e) {
     console.error("Test failed:", e);
  }
}
test();
