import "./list.css"
import UserInfo from "./userInfo/Userinfo";
import ChatList from "./chatList/ChatList"

const List = () => {
    return(
        <div className='list'>
            <UserInfo/>
            <ChatList/>
        </div>
    )
}
export default List