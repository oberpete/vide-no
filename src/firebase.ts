import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const app = initializeApp({
    apiKey: "AIzaSyBUydPZ7nI8KOraLTxTrP76gsebe1Slhp4",
    authDomain: "vide-no.firebaseapp.com",
    projectId: "vide-no",
    storageBucket: "vide-no.appspot.com",
    messagingSenderId: "870712648994",
    appId: "1:870712648994:web:23f2eeb369ae689611f17b"
});

/* const isNode =
  typeof process !== 'undefined' &&
  process.versions != null &&
  process.versions.node != null;
if (!isNode || import.meta.env.PROD)
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(
      'video2023secret'
    ),
    isTokenAutoRefreshEnabled: true,
  }); */

export const firestore = getFirestore(app);