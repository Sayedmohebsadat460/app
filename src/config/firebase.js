import { initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, setDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";

const firebaseConfig = {
    apiKey: "AIzaSyAI6345QzfkWsWWPu5gXhNBw13Pj3Kbk38",
    authDomain: "chat-app-sms.firebaseapp.com",
    projectId: "chat-app-sms",
    storageBucket: "chat-app-sms.appspot.com",
    messagingSenderId: "285515251410",
    appId: "1:285515251410:web:354244f8c11cfe4649370b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const signup = async (username, email, password) => {
    try {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        const user = res.user;
        await setDoc(doc(db, "users", user.uid), {
            id: user.uid,
            username: username.toLowerCase(),
            email,
            password,
            name: "",
            avatar: "",
            bio: "Hey There I am using Sadat Chat app",
            lastSeen: Date.now()
        });
        await setDoc(doc(db, "chats", user.uid), {
            chatData: []
        });
    } catch (error) {
        console.error(error);
        toast.error(error.code.split('/')[1].split('-').join(" "));
    }
};
const login = async (email, password) => {
    try {
        await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
        console.error(error)
        toast.error(error.code.split('/')[1].split('-').join(" "))
    }
}
const logout = async () => {
    try {
        await signOut(auth)

    } catch (error) {
        console.error(error)
        toast.error(error.code.split('/')[1].split('-').join(" "))
    }
}
export { signup, login, logout, auth, db  };
