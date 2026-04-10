import { createToiClient } from './src/toiClient';
import fs from 'fs';

async function run() {
  const cookiePath = '../cookie'; // from /media/kimyobu/Project/ToiZero-remote-panel/backend .. Wait, it's in the root
  const cookie = fs.readFileSync(cookiePath, 'utf8').trim().split('\t').pop() || '';
  const c = createToiClient(cookie);
  const res = await c.get('/00-pre-toi/tasks/A1-001/description');
  fs.writeFileSync('../A1-001-desc.html', res.data);
  console.log("Written", res.data.length);
}
run();
