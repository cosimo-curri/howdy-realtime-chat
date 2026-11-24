import OverHeader from "./OverHeader";
import UserSearch from "./UserSearch";

function OverSearch(props) {
    return (
        <div className="over-page search">
            <OverHeader name="Search" />
            <div className="list-users">
                {props.listUserSearch.map((user) =>
                    <UserSearch
                        handleOpenChat={props.handleOpenChat}
                        handleListChat={props.handleListChat}
                        socket={props.socket}
                        handle={props.handleActiveChat}
                        id={user._id}
                        key={user._id}
                        username={user.username}
                        email={user.email}
                        profilePictureURL={user.profilePictureURL}
                        isAlreadyFriendOrRequest={user.isAlreadyFriendOrRequest}
                    />
                )}
            </div>
        </div>
    );
}

export default OverSearch;