import { useEffect, useRef, useState } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import { onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { formatDistanceToNow } from 'date-fns';

const Chat = () => {
    const [chat, setChat] = useState();
    const [open, setOpen] = useState(false);
    const [text, setText] = useState("");
    const [img, setImg] = useState({
        file: null,
        url: "",
    });
    const [showUserInfo, setShowUserInfo] = useState(false); // State for user info display
    const [selectedMessageId, setSelectedMessageId] = useState(null);

    const { chatId, user, isCurrentUserBlocked, isReceiverUserBlocked } = useChatStore();
    const { currentUser } = useUserStore();

    const endRef = useRef(null);

    // Reference to the audio element
    const notificationSoundRef = useRef(new Audio("/notification.mp3"));

    useEffect(() => {
        if (chat && chat.messages.length > 0) {
            // Scroll only on initial load or when new messages are added
            endRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [chat]);
    
    useEffect(() => {
        const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
            const newChat = res.data();
            if (newChat && chat && newChat.messages.length > chat.messages.length) {
                const lastMessage = newChat.messages[newChat.messages.length - 1];
                if (lastMessage.senderId !== currentUser.id) {
                    // Play notification sound if a new message is received and the current user is not the sender
                    notificationSoundRef.current.play();
                }
            }
            setChat(newChat);
        });

        return () => {
            unSub();
        };
    }, [chatId, chat, currentUser.id]);

    const handleEmoji = (e) => {
        setText((prev) => prev + e.emoji);
        setOpen(false);
    };

    const handleImg = (e) => {
        if (e.target.files[0]) {
            console.log("Selected file:", e.target.files[0]);  // Log the selected file
            setImg({
                file: e.target.files[0],
                url: URL.createObjectURL(e.target.files[0]),
            });
        }
    };

    const uploadImage = async (file) => {
        const storage = getStorage();
        const storageRef = ref(storage, `images/${file.name}`);
        console.log("Uploading image:", file.name);  // Log the file upload
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        console.log("Image uploaded, download URL:", downloadURL);  // Log the download URL
        return downloadURL;
    };

    const handleSend = async () => {
        if (text === "" && !img.file) return;

        let imgUrl = null;

        try {
            if (img.file) {
                console.log("Uploading image...");  // Log image upload start
                imgUrl = await uploadImage(img.file);
                console.log("Image URL received:", imgUrl);  // Log received image URL
            }

            await updateDoc(doc(db, "chats", chatId), {
                messages: arrayUnion({
                    id: Date.now().toString(), // Unique ID for each message
                    senderId: currentUser.id,
                    text,
                    createdAt: new Date(),
                    ...(imgUrl && { img: imgUrl }),
                }),
            });

            const userIDs = [currentUser.id, user.id];

            for (const id of userIDs) {
                const userChatsRef = doc(db, "userchats", id);
                const userChatsSnapshots = await getDoc(userChatsRef);

                if (userChatsSnapshots.exists()) {
                    const userChatsData = userChatsSnapshots.data();
                    const chatIndex = userChatsData.chats.findIndex((c) => c.chatId === chatId);

                    userChatsData.chats[chatIndex].lastMessage = text;
                    userChatsData.chats[chatIndex].isSeen = id === currentUser.id ? true : false;
                    userChatsData.chats[chatIndex].updatedAt = Date.now();

                    await updateDoc(userChatsRef, {
                        chats: userChatsData.chats,
                    });
                }
            }
        } catch (error) {
            console.log("Error sending message:", error);
        }

        setImg({
            file: null,
            url: "",
        });
        setText("");
    };

    const handleDeleteMessage = async (messageId) => {
        try {
            await updateDoc(doc(db, "chats", chatId), {
                messages: arrayRemove(chat.messages.find(message => message.id === messageId)),
            });
        } catch (error) {
            console.log("Error deleting message:", error);
        } finally {
            setSelectedMessageId(null);
        }
    };

    const toggleDeleteButton = (messageId) => {
        setSelectedMessageId(messageId === selectedMessageId ? null : messageId);
    };

    // Function to handle info button click
    const handleInfoClick = () => {
        setShowUserInfo(true);
        setTimeout(() => {
            setShowUserInfo(false);
        }, 6000); // Hide after 6 seconds
    };

    return (
        <div className='chat'>
            <div className="top">
                <div className="user">
                    <a href={user?.avatar || "./avatar.png"} download>
                        <img src={user?.avatar || "./avatar.png"} alt="" />
                    </a>
                    <div className="texts">
                        <span>{user?.username}</span>
                    </div>
                </div>
                <div className="icons">
                    <img src="info.png" alt="" onClick={handleInfoClick} />
                    {showUserInfo && (
                        <div className="userInfo">
                            <p>Username: {user?.username}</p> <br />
                            <p>Email: {user?.email}</p>
                        </div>
                    )}
                </div>
            </div>
            <div className="center">
                {chat?.messages?.map((message, index) => (
                    <div
                        className={message.senderId === currentUser?.id ? "message own" : "message"}
                        key={message.id}
                        onClick={() => toggleDeleteButton(message.id)}
                    >
                        <div className="texts">
                            {message.img && <img src={message.img} alt="" />}
                            <p>{message.text}</p>
                            <span>{formatDistanceToNow(message.createdAt.toDate(), { addSuffix: true })}</span>
                            {(selectedMessageId === message.id && index === chat.messages.length - 1) && (
                                <button className="deleteButton" onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteMessage(message.id);
                                }}>Delete this message</button>
                            )}
                        </div>
                    </div>
                ))}

                {img.url && (
                    <div className="message own">
                        <div className="texts">
                            <img src={img.url} alt="" />
                        </div>
                    </div>
                )}
                <div ref={endRef}></div>
            </div>

            <div className="bottom">
                <div className="icons">
                    <label htmlFor="file">
                        <img src="./img.png" alt="" />
                    </label>
                    <input type="file" id="file" style={{ display: "none" }} onChange={handleImg} disabled={isCurrentUserBlocked || isReceiverUserBlocked} />
                  
                </div>
                <input
                    type="text"
                    placeholder={isCurrentUserBlocked || isReceiverUserBlocked ? "Sadly, You can't send a message" : "Type a message ..."}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={isCurrentUserBlocked || isReceiverUserBlocked}
                />

                <div className="emoji">
                    <img src="./emoji.png" alt="" onClick={() => setOpen((prev) => !prev)} style={{ pointerEvents: isCurrentUserBlocked || isReceiverUserBlocked ? "none" : "auto" }} />
                    {open && !isCurrentUserBlocked && !isReceiverUserBlocked && (
                        <div className="picker">
                            <EmojiPicker onEmojiClick={handleEmoji} />
                        </div>
                    )}
                </div>
                <button className="sendButton" onClick={handleSend} disabled={isCurrentUserBlocked || isReceiverUserBlocked}>
                    Send
                </button>
            </div>
        </div>
    );
};

export default Chat;
