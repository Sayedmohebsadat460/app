import React, { useContext, useEffect, useState } from 'react'
import './ChatBox.css'
import assets from '../../assets/assets'
import { AppContext } from '../../context/AppContext'
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { toast } from 'react-toastify'
import  upload  from '../../lib/Upload'
const ChatBox = () => {
  const {userData,messagesId,chatUser,messages,setMessages} = useContext(AppContext);
  const [input,setInput] = useState("")
  const sendMessage = async () => {
    try {
      if (input.trim() && messagesId) {
        await updateDoc(doc(db, 'messages', messagesId), {
          messages: arrayUnion({
            sId: userData.id,
            text: input,
            createdAt: new Date()
          })
        });
  
        const userIDs = [chatUser.rId, userData.id];
        for (const id of userIDs) {
          const userChatsRef = doc(db, 'chats', id);
          const userChatsSnapshot = await getDoc(userChatsRef);
          if (userChatsSnapshot.exists()) {
            const userChatData = userChatsSnapshot.data();
            const chatIndex = userChatData.chatsData.findIndex((c) => c.messageId === messagesId);
            
            if (chatIndex !== -1) {
              userChatData.chatsData[chatIndex].lastMessage = input.slice(0, 30);
              userChatData.chatsData[chatIndex].updatedAt = Date.now();
              if (userChatData.chatsData[chatIndex].rId === userData.id) {
                userChatData.chatsData[chatIndex].messageSeen = false;
              }
              await updateDoc(userChatsRef, { chatsData: userChatData.chatsData });
            }
          }
        }
  
        setInput("");
      }
    } catch (error) {
      toast.error("Failed to send message: " + error.message);
    }
    setInput("")
  };
  const sendImage = async (e) =>{
    try {
      const fileUrl = await upload(e.target.files[0])
      if (fileUrl && messagesId) {
        await updateDoc(doc(db, 'messages', messagesId), {
          messages: arrayUnion({
            sId: userData.id,
            image: fileUrl,
            createdAt: new Date()
          })
      })
      const userIDs = [chatUser.rId, userData.id];
        for (const id of userIDs) {
          const userChatsRef = doc(db, 'chats', id);
          const userChatsSnapshot = await getDoc(userChatsRef);
          if (userChatsSnapshot.exists()) {
            const userChatData = userChatsSnapshot.data();
            const chatIndex = userChatData.chatsData.findIndex((c) => c.messageId === messagesId);
            
            if (chatIndex !== -1) {
              userChatData.chatsData[chatIndex].lastMessage = "Image";
              userChatData.chatsData[chatIndex].updatedAt = Date.now();
              if (userChatData.chatsData[chatIndex].rId === userData.id) {
                userChatData.chatsData[chatIndex].messageSeen = false;
              }
              await updateDoc(userChatsRef, { chatsData: userChatData.chatsData });
            }
          }
        }
    }
    } catch (error) {
      toast.error(error.message)
    }
  }
  const convertTimestamp = (timestamp) =>{
    let date = timestamp.toDate()
    const hour = date.getHours()
    const minute = date.getMinutes()
    if(hour>12){
      return hour-12 + ":" + minute + "PM"
    }
    else{
      return hour + ":" + minute + "AM"
    }
  }
  useEffect(() => {
    if (messagesId) { 
      const unSub = onSnapshot(doc(db, 'messages', messagesId), (res) => {
          setMessages(res.data().messages.reverse());
      });
      return () => {
        unSub();
      };
    }
  }, [messagesId]);
  return chatUser ? (
    <div className='chat-box'>
      <div className="chat-user">
        <img src={chatUser.userData.avatar} alt="" />
        <p>{chatUser.userData.name} {Date.now()-chatUser.userData.lastSeen <= 7000 ? <img className='dot' src={assets.green_dot} alt="" /> : null}</p>
        <img src={assets.help_icon} alt="" className='help'/>
      </div>
      <div className="chat-msg">
  {messages.map((msg, index) => (
    <div key={index} className={msg.sId === userData.id ? "s-msg" : "r-msg"}>
      {msg["image"] ? <img className='msg-img' src={msg.image} alt="" /> : <p className="msg">{msg.text}</p>}
      <div>
        <img src={msg.sId === userData.id ? userData.avatar : chatUser.userData.avatar} alt="" />
        <p>{convertTimestamp(msg.createdAt)}</p>
      </div>
    </div>
  ))}
</div>

      <div className="chat-input">
        <input onChange={(e)=>setInput(e.target.value)} value={input} type="text" placeholder='Send a message' />
        <input onChange={sendImage} type="file" id='image' accept='image/png, image/jpeg' hidden />
        <label htmlFor="image">
          <img src={assets.gallery_icon} alt="" />
        </label>
        <img onClick={sendMessage} src={assets.send_button} alt="" />
      </div>
    </div>
  )
  :<div className='chat-welcome'>
    <img src={assets.logo_icon} alt="" />
    <p>Chat any time , Any where</p>
  </div>
}

export default ChatBox