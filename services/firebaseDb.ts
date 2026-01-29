
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { firebaseConfig } from './firebaseConfig';
import { Word, UserStats, StudyHistory, Collection } from '../types';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUser: User | null = null;

const getFirebaseUser = (): Promise<User> => {
  return new Promise((resolve, reject) => {
    if (currentUser) {
      return resolve(currentUser);
    }
    const unsubscribe = onAuthStateChanged(auth, user => {
      unsubscribe();
      if (user) {
        currentUser = user;
        resolve(user);
      } else {
        signInAnonymously(auth).then(userCredential => {
          currentUser = userCredential.user;
          resolve(userCredential.user);
        }).catch(reject);
      }
    });
  });
};

const getUserDocRef = async (path: string) => {
    const user = await getFirebaseUser();
    return doc(db, 'users', user.uid, ...path.split('/'));
};

const getUserColRef = async (path: string) => {
    const user = await getFirebaseUser();
    return collection(db, 'users', user.uid, ...path.split('/'));
}

export const fbGetWords = async (): Promise<Word[]> => {
    const colRef = await getUserColRef('words');
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => doc.data() as Word);
};

export const fbSaveWords = async (words: Word[]): Promise<void> => {
    const user = await getFirebaseUser();
    const batch = writeBatch(db);
    const oldWordsSnapshot = await getDocs(collection(db, 'users', user.uid, 'words'));
    oldWordsSnapshot.forEach(doc => batch.delete(doc.ref));
    words.forEach(word => {
        const docRef = doc(db, 'users', user.uid, 'words', word.id);
        batch.set(docRef, word);
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

export const fbGetCollections = async (): Promise<Collection[]> => {
    const colRef = await getUserColRef('collections');
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => doc.data() as Collection);
};

export const fbSaveCollections = async (collections: Collection[]): Promise<void> => {
    const user = await getFirebaseUser();
    const batch = writeBatch(db);
    const oldCollectionsSnapshot = await getDocs(collection(db, 'users', user.uid, 'collections'));
    oldCollectionsSnapshot.forEach(doc => batch.delete(doc.ref));
    collections.forEach(c => {
        const docRef = doc(db, 'users', user.uid, 'collections', c.id);
        batch.set(docRef, c);
    });
    await batch.commit();
};
