import { useEffect, useState } from "react";
import "./chatList.css";
import AddUser from "./addUser/AddUser";
import { useUserStore } from "../../../lib/userStore";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useChatStore } from "../../../lib/chatStore";

const ChatList = () => {
    const [chats, setChats] = useState([]);
    const [addMode, setAddMode] = useState(false);
    const [input, setInput] = useState("");
    const [visibleDelete, setVisibleDelete] = useState(null);

    const { currentUser } = useUserStore();
    const { chatId, changeChat } = useChatStore();

    useEffect(() => {
        const unSub = onSnapshot(doc(db, "userchats", currentUser.id), async (res) => {
            const items = res.data().chats;

            const promises = items.map(async (item) => {
                const userDocRef = doc(db, "users", item.receiverId);
                const userDocSnap = await getDoc(userDocRef);
                const user = userDocSnap.data();
                return { ...item, user };
            });
            const chatData = await Promise.all(promises);

            // Filter to ensure unique users
            const uniqueChats = chatData.filter(
                (chat, index, self) =>
                    index === self.findIndex((c) => c.user.id === chat.user.id)
            );

            setChats(uniqueChats.sort((a, b) => b.updatedAt - a.updatedAt));
        });

        return () => {
            unSub();
        };
    }, [currentUser.id]);

    const handleSelect = async (chat) => {
        const userChats = chats.map((item) => {
            const { user, ...rest } = item;
            return rest;
        });

        const chatIndex = userChats.findIndex((item) => item.chatId === chat.chatId);
        userChats[chatIndex].isSeen = true;

        const userChatsRef = doc(db, "userchats", currentUser.id);

        try {
            await updateDoc(userChatsRef, {
                chats: userChats,
            });
            changeChat(chat.chatId, chat.user);
        } catch (error) {
            console.log(error);
        }
    };

    const handleDelete = async (chatId) => {
        const updatedChats = chats.filter(chat => chat.chatId !== chatId);
        setChats(updatedChats);

        const userChatsRef = doc(db, "userchats", currentUser.id);

        try {
            await updateDoc(userChatsRef, {
                chats: updatedChats.map(({ user, ...rest }) => rest),
            });
        } catch (error) {
            console.log(error);
        }
    };

    const toggleDeleteButton = (chatId) => {
        setVisibleDelete((prev) => (prev === chatId ? null : chatId));
    };

    const filteredChats = chats.filter((c) =>
        c.user.username.toLowerCase().includes(input.toLowerCase())
    );

    return (
        <div className="chatList">
            <div className="search">
                <div className="searchBar">
                    <img src="./search.png" alt="" />
                    <input
                        type="text"
                        placeholder="Search"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                </div>
                <img
                    src={addMode ? "./minus.png" : "./plus.png"}
                    alt=""
                    className="Add"
                    onClick={() => setAddMode((prev) => !prev)}
                />
            </div>

            {filteredChats.map((chat) => (
                <div
                    className="item"
                    key={chat.chatId}
                    onClick={() => handleSelect(chat)}
                    style={{
                        backgroundColor: chat?.isSeen ? "transparent" : "#5183fe",
                    }}
                >
                    <img
                        src={chat.user.blocked.includes(currentUser.id) ? "./avatar.png" : chat.user.avatar}
                        alt=""
                    />
                    <div className="texts">
                        <span>
                            {chat.user.blocked.includes(currentUser.id) ? "User" : chat.user.username}
                        </span>
                        <p>
                            {chat.user.blocked.includes(currentUser.id) ? "You are blocked" : chat.lastMessage}
                        </p>
                    </div>
                    <img
                        src="./more.png"
                        alt=""
                        className="more"
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleDeleteButton(chat.chatId);
                        }}
                    />
                    {visibleDelete === chat.chatId && (
                        <button
                        className="delete"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(chat.chatId);
                            }}
                        >
                            Delete
                        </button>
                    )}
                </div>
            ))}
            {addMode && <AddUser />}
        </div>
    );
};

export default ChatList;
