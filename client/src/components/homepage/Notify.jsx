import { API_BASE_URL } from "../../config";
function Notify(props) {
    function handleAction(action) {
        fetch(`${API_BASE_URL}/tokenApi/manageUsers/manageFriendRequest`, {
            method: "POST",
            headers: new Headers({
                "Content-Type": "application/json",
                token: sessionStorage.getItem("token"),
            }),
            body: JSON.stringify({
                pendingRequestId: props.id,
                action: action,
            })
        })
            .then((res) => {
                if (res.status === 200) {
                    return res.json();
                }
            })
            .then((obj) => {
                props.handle(props.id);
            })
    }

    return (
        <div className="single-user" key={props.id}>
            <div className="left-container">
                <div className="foto-status">
                    <img src={props.profilePictureURL} className="user-foto" alt="photo" />
                </div>
                <div className="info-message">
                    <span className="username-message">{props.username}</span>
                    {props.email && <span className="text-message">{props.email}</span>}
                </div>
            </div>
            <div className="right-container">
                <button className="btn-accept" onClick={() => handleAction("ACCEPT")}>Accept</button>
                <button className="btn-decline" onClick={() => handleAction("REJECT")}>Decline</button>
            </div>
        </div>
    );
}

export default Notify;