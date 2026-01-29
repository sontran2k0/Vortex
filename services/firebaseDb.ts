import { initializeApp } from 'firebase/app';
import {
  getFirestore, doc, getDoc, setDoc,
  collection, getDocs, writeBatch,
  query, limit, orderBy, deleteDoc
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { firebaseConfig } from './firebaseConfig';
import { Word, UserStats, StudyHistory, Collection } from '../types';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUser: User | null = null;

const getFirebaseUser = (): Promise<User> => {
  return new Promise((resolve, reject) => {
    if (currentUser) return resolve(currentUser);

    const unsubscribe = onAuthStateChanged(auth, user => {
      unsubscribe();
      if (user) {
        currentUser = user;
        resolve(user);
      } else {
        signInAnonymously(auth)
          .then(cred => {
            currentUser = cred.user;
            resolve(cred.user);
          })
          .catch(reject);
      }
    });
  });
};

const getUserDocRef = async (path: string) => {
  const user = await getFirebaseUser();
  return doc(db, 'users', user.uid, ...path.split('/'));
};

export const fbGetWords = async (limitCount = 50): Promise<Word[]> => {
  const user = await getFirebaseUser();
  const q = query(
    collection(db, 'users', user.uid, 'words'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => d.data() as Word);
};

export const fbSaveWords = async (words: Word[]): Promise<void> => {
  const user = await getFirebaseUser();
  const batch = writeBatch(db);

  words.forEach(word => {
    const ref = doc(db, 'users', user.uid, 'words', word.id);
    batch.set(ref, word, { merge: true });
  });

  await batch.commit();
};

export const fbGetStats = async (): Promise<UserStats | null> => {
  const docRef = await getUserDocRef('data/stats');
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() as UserStats : null;
};

export const fbSaveStats = async (stats: UserStats): Promise<void> => {
  const docRef = await getUserDocRef('data/stats');
  await setDoc(docRef, stats, { merge: true });
};

export const fbGetHistory = async (): Promise<StudyHistory[]> => {
  const docRef = await getUserDocRef('data/history');
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data().history as StudyHistory[]) : [];
};

export const fbSaveHistory = async (history: StudyHistory[]): Promise<void> => {
  const docRef = await getUserDocRef('data/history');
  await setDoc(docRef, { history });
};

export const fbGetCollections = async (limitCount = 20): Promise<Collection[]> => {
  const user = await getFirebaseUser();
  const q = query(
    collection(db, 'users', user.uid, 'collections'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => d.data() as Collection);
};

export const fbSaveCollections = async (collections: Collection[]): Promise<void> => {
  const user = await getFirebaseUser();
  const batch = writeBatch(db);

  collections.forEach(c => {
    const ref = doc(db, 'users', user.uid, 'collections', c.id);
    batch.set(ref, c, { merge: true });
  });

  await batch.commit();
};

export const fbDeleteCollection = async (id: string): Promise<void> => {
  const user = await getFirebaseUser();
  await deleteDoc(doc(db, 'users', user.uid, 'collections', id));
};
