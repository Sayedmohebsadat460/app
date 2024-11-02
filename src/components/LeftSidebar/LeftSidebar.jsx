import React, { useContext, useState } from 'react';
import './LeftSidebar.css';
import assets from '../../assets/assets';
import { arrayUnion, collection, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';

const LeftSidebar = () => {
  const { userData, chatData,chatUser,setChatUser,setMessagesId,messageId } = useContext(AppContext);
  const [user, setUser] = useState(null);
  const [showSearch, setShowSearch] = useState(false);

  const inputHandler = async (e) => {
    try {
      const input = e.target.value.toLowerCase();
      if (input) {
        setShowSearch(true);
        const userRef = collection(db, 'users');
        const q = query(userRef, where("username", "==", input.toLowerCase()));
        const querySnap = await getDocs(q);
        if (!querySnap.empty && querySnap.docs[0].data().id !== userData.id) {
          let userExist = chatData.some(chat => chat.rId === querySnap.docs[0].data().id);
          if (!userExist) {
            setUser(querySnap.docs[0].data());
          }
        } else {
          setUser(null);
        }
      } else {
        setShowSearch(false);
      }
    } catch (error) {
      toast.error("Error fetching user data.");
      console.error(error);
    }
  };

  const addChat = async () => {
    const messagesRef = collection(db, "messages");
    const chatRef = collection(db, "chats");
    const contactsRef = collection(db, "contacts");

    try {
      const newMessageRef = doc(messagesRef);
      await setDoc(newMessageRef, {
        createAt: serverTimestamp(),
        messages: [],
      });

      await updateDoc(doc(chatRef, user.id), {
        chatData: arrayUnion({
          messageId: newMessageRef.id,
          lastMessage: "",
          rId: userData.id,
          updatedAt: Date.now(),
          messageSeen: true,
        }),
      });

      await updateDoc(doc(chatRef, userData.id), {
        chatData: arrayUnion({
          messageId: newMessageRef.id,
          lastMessage: "",
          rId: user.id,
          updatedAt: Date.now(),
          messageSeen: true,
        }),
      });

      const contactExists = await getDocs(query(contactsRef, where("userId", "==", user.id), where("contactId", "==", userData.id)));
      if (contactExists.empty) {
        await setDoc(doc(contactsRef, `${userData.id}_${user.id}`), {
          userId: userData.id,
          contactId: user.id,
          createdAt: serverTimestamp(),
        });
        toast.success(`${user.name} has been added to your contacts!`);
      } else {
        toast.warn(`${user.name} is already in your contacts.`);
      }
      
    } catch (error) {
      toast.error(error.message);
      console.error(error);
    }
  };
  const setChat = (item) => {
    setMessagesId(item.messageId)
    setChatUser(item)
  }
  return (
    <div className='ls'>
      <div className="ls-top">
        <div className="ls-nav">
          <img src={assets.logo} alt="Logo" className='logo' />
        </div>
        <div className="ls-search">
          <img src={assets.search_icon} alt="Search Icon" />
          <input onChange={inputHandler} type="text" placeholder='Search here' />
        </div>
      </div>
      <div className="ls-list">
        {showSearch && user ? (
          <div onClick={addChat} className='friends add-user'>
            <img src={user.avatar} alt={'avatar'} />
            <p>{user.name}</p>
          </div>
        ) : (
          chatData.map((item, index) => (
            <div onClick={()=>setChat(item)} className="friends" key={index}>
              <img src={item.userData.avatar} alt="Default Profile" />
              <div>
                <p>{item.userData.name}</p>
                <span>{item.lastMessage}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LeftSidebar;
