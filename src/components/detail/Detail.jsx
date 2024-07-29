import { useEffect, useState } from "react";
import { useChatStore } from "../../lib/chatStore";
import { auth, db } from "../../lib/firebase";
import { useUserStore } from "../../lib/userStore";
import { doc, getDoc, updateDoc, arrayRemove, arrayUnion } from "firebase/firestore";
import "./detail.css";

const Detail = () => {
    const { chatId, user, isCurrentUserBlocked, isReceiverUserBlocked, changeBlock } = useChatStore();
    const { currentUser } = useUserStore();
    const [sharedPhotos, setSharedPhotos] = useState([]);
    const [sharedFiles, setSharedFiles] = useState([]);
    const [showPhotos, setShowPhotos] = useState(false); // State to toggle photo visibility
    const [showFiles, setShowFiles] = useState(false); // State to toggle file visibility

    useEffect(() => {
        const fetchSharedContent = async () => {
            if (!chatId) return;

            const chatDocRef = doc(db, "chats", chatId);
            const chatDocSnapshot = await getDoc(chatDocRef);

            if (chatDocSnapshot.exists()) {
                const chatData = chatDocSnapshot.data();

                // Fetch shared photos
                const photos = chatData.messages
                    .filter((message) => message.img) // Filter messages that contain images
                    .map((message) => {
                        const url = new URL(message.img);
                        const name = decodeURIComponent(url.pathname.split('/').pop());
                        return {
                            name: name,
                            url: message.img,
                        };
                    });
                setSharedPhotos(photos);

                // Fetch shared files
                const files = chatData.messages
                    .filter((message) => message.file) // Filter messages that contain files
                    .map((message) => {
                        const url = new URL(message.file);
                        const name = decodeURIComponent(url.pathname.split('/').pop());
                        return {
                            name: name,
                            url: message.file,
                        };
                    });
                setSharedFiles(files);
            }
        };

        fetchSharedContent();
    }, [chatId]);

    const togglePhotos = () => {
        setShowPhotos(!showPhotos);
    };

    const toggleFiles = () => {
        setShowFiles(!showFiles);
    };

    const handleBlock = async () => {
        if (!user) return;

        const userDocRef = doc(db, "users", currentUser.id);
        try {
            await updateDoc(userDocRef, {
                blocked: isReceiverUserBlocked ? arrayRemove(user.id) : arrayUnion(user.id),
            });
            changeBlock();
        } catch (error) {
            console.log(error);
        }
    };

    const handleDownload = (url, name) => {
        // Create a link element
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', name);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className='detail'>
            <div className="user">
                <img src={user?.avatar || "./avatar.png"} alt="" />
                <h2>{user?.username}</h2>
            </div>
            <div className="info">
                <div className="option" onClick={togglePhotos}>
                    <div className="title">
                        <span>Shared photos</span>
                        <img src={showPhotos ? "./arrowUp.png" : "./arrowDown.png"} alt="" />
                    </div>
                    {showPhotos && (
                        <div className="photos">
                            {sharedPhotos.length > 0 ? (
                                sharedPhotos.map((photo, index) => (
                                    <div className="photoItem" key={index}>
                                        <div className="photoDetail">
                                            <img src={photo.url} alt={photo.name} />
                                            <span>{photo.name}</span>
                                        </div>
                                        <img
                                            src="./download.png"
                                            alt="Download"
                                            className="icon"
                                            onClick={() => handleDownload(photo.url, photo.name)}
                                        />
                                    </div>
                                ))
                            ) : (
                                <div className="noContentMessage">No shared photos</div>
                            )}
                        </div>
                    )}
                </div>
                <div className="option" onClick={toggleFiles}>
                    <div className="title">
                        <span>Shared Files</span>
                        <img src={showFiles ? "./arrowUp.png" : "./arrowDown.png"} alt="" />
                    </div>
                    {showFiles && (
                        <div className="files">
                            {sharedFiles.length > 0 ? (
                                sharedFiles.map((file, index) => (
                                    <div className="fileItem" key={index}>
                                        <div className="fileDetail">
                                            <span>{file.name}</span>
                                        </div>
                                        <img
                                            src="./download.png"
                                            alt="Download"
                                            className="icon"
                                            onClick={() => handleDownload(file.url, file.name)}
                                        />
                                    </div>
                                ))
                            ) : (
                                <div className="noContentMessage" ><br />  No shared files</div>
                            )}
                        </div>
                    )}
                </div>
                <button onClick={handleBlock}>
                    {isCurrentUserBlocked ? "You are blocked !!" : isReceiverUserBlocked ? "User Blocked !" : "Block user"}
                </button>
                <button className="logout" onClick={() => auth.signOut()}>
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Detail;
