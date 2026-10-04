import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';

const firebaseConfig = JSON.parse(
  fs.readFileSync(new URL('../../firebase-applet-config.json', import.meta.url), 'utf-8')
);

if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

export const adminAuth = getAuth();
