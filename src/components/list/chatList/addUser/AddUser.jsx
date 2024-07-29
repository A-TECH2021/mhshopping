import { arrayUnion, collection, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where, getDoc } from "firebase/firestore";
import "./addUser.css";
import { db } from "../../../../lib/firebase";
import { useState } from "react";
import { useUserStore } from "../../../../lib/userStore";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AddUser = () => {
    const [user, setUser] = useState(null);
    const [userNotFound, setUserNotFound] = useState(false);

    const { currentUser } = useUserStore();

    const handleSearch = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const username = formData.get("username");

        try {
            const userRef = collection(db, "users");
            const q = query(userRef, where("username", "==", username));
            const querySnapShot = await getDocs(q);

            if (!querySnapShot.empty) {
                setUser(querySnapShot.docs[0].data());
                setUserNotFound(false);
            } else {
                setUser(null);
                setUserNotFound(true);
            }
        } catch (error) {
            console.log(error);
        }
    };

    const handleAdd = async () => {
        const chatRef = collection(db, "chats");
        const userChatsRef = collection(db, "userchats");

        try {
            if (!user) {
                return;
            }

            // Check if the user is already added
            const userChatsDoc = await getDoc(doc(userChatsRef, currentUser.id));
            if (userChatsDoc.exists()) {
                const userChatsData = userChatsDoc.data();
                const isUserAlreadyAdded = userChatsData.chats.some(chat => chat.receiverId === user.id);

                if (isUserAlreadyAdded) {
                    toast.error("User already added");
                    return;
                }
            }

            const newChatRef = doc(chatRef);

            await setDoc(newChatRef, {
                createdAt: serverTimestamp(),
                messages: [],
            });

            await updateDoc(doc(userChatsRef, user.id), {
                chats: arrayUnion({
                    chatId: newChatRef.id,
                    lastMessage: "",
                    receiverId: currentUser.id,
                    updatedAt: Date.now(),
                }),
            });

            await updateDoc(doc(userChatsRef, currentUser.id), {
                chats: arrayUnion({
                    chatId: newChatRef.id,
                    lastMessage: "",
                    receiverId: user.id,
                    updatedAt: Date.now(),
                }),
            });

            toast.success("User added successfully");
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <div className="addUser">
            <ToastContainer />
            <form onSubmit={handleSearch}>
                <input type="text" placeholder="Username" name="username" />
                <button>Search</button>
            </form>
            {userNotFound && <p className="error-message">User not found.</p>}
            {user && (
                <div className="user">
                    <div className="detail">
                        <img src={user.avatar || "./avatar.png"} alt="" />
                        <span>{user.username}</span>
                    </div>
                    <button onClick={handleAdd}>Add user</button>
                </div>
            )}
        </div>
    );
};

export default AddUser;
