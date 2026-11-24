import { API_BASE_URL } from "../../config";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function UserSearch(props) {
    const navigate = useNavigate();
    const [statusRequest, setStatus] = useState(props.isAlreadyFriendOrRequest);

    function handleRequest(event) {
        event.preventDefault();
        fetch(`${API_BASE_URL}/tokenApi/manageUsers/sendFriendRequest`, {
            method: "POST",
            headers: new Headers({
                "Content-Type": "application/json",
                token: sessionStorage.getItem("token"),
            }),
            body: JSON.stringify({
                userId: event.target.id,
            })
        })
            .then((res) => {
                if (res.status === 200) {
                    return res.json();
                }
            })
            .then((obj) => {
                if (obj.message === "SEND_FRIEND_REQUEST_ERROR") {
                    toast.error('An error has occurred', {
                        position: "bottom-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                }
                else if (obj.message === "ALREADY_FRIEND") {
                    toast.warn('Already friend', {
                        position: "bottom-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                }
                else if (obj.message === "ALREADY_REQUEST") {
                    toast.error('Already request', {
                        position: "bottom-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });

                }
                else if (obj.message === "SEND_FRIEND_REQUEST_OK") {
                    setStatus("ALREADY_REQUEST");
                    toast.success('Request sent successfully', {
                        position: "bottom-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                    props.socket.current.emit("sendFriendRequest", {
                        _id: obj.pendingRequest._id,
                        recipientUserSocket: event.target.id,
                        date: obj.pendingRequest.date,
                        recipientUser: {
                            _id: props._id,
                            username: props.username,
                            email: props.mail,
                            profilePictureURL: props.profilePictureURL
                        },
                        senderUser: {
                            _id: JSON.parse(sessionStorage.getItem("infoLoggedUser"))._id,
                            username: JSON.parse(sessionStorage.getItem("infoLoggedUser")).username,
                            email: JSON.parse(sessionStorage.getItem("infoLoggedUser")).email,
                            profilePictureURL: JSON.parse(sessionStorage.getItem("infoLoggedUser")).profilePictureURL
                        }
                    })
                }
                else {
                    toast.error('An error has occurred', {
                        position: "bottom-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                }
            })
    }

    function handleProfile(event) {
        event.preventDefault();
        fetch(`${API_BASE_URL}/tokenApi/manageUsers/getUserByUsername/` + props.username, {
            method: "GET",
            headers: new Headers({
                token: sessionStorage.getItem("token"),
            }),
        })
            .then((res) => {
                if (res.status === 200) {
                    return res.json();
                }
            })
            .then((obj) => {
                if (obj === "FIND_USER_QUERY_ERROR") {
                    toast.error('An error has occurred', {
                        position: "bottom-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                }
                else {
                    sessionStorage.setItem("profileUser", JSON.stringify(obj));
                    navigate("/profile/" + obj.username);
                }
            })
    }

    function handleWithdrawn(event) {
        event.preventDefault();
        fetch(`${API_BASE_URL}/tokenApi/manageUsers/getUserByUsername/` + props.username, {
            method: "GET",
            headers: new Headers({
                token: sessionStorage.getItem("token"),
            }),
        })
            .then((res) => {
                if (res.status === 200) {
                    return res.json();
                }
            })
            .then((obj) => {
                if (obj === "FIND_USER_QUERY_ERROR") {
                    toast.error('An error has occurred', {
                        position: "bottom-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                }
                else {
                    const idPendingRequest = obj.isAlreadyFriendOrRequest.pendingRequestId;
                    fetch(`${API_BASE_URL}/tokenApi/manageUsers/deletePendingRequest`, {
                        method: "DELETE",
                        headers: new Headers({
                            "Content-type": "application/json",
                            token: sessionStorage.getItem("token"),
                        }),
                        body: JSON.stringify({
                            pendingRequestId: obj.isAlreadyFriendOrRequest.pendingRequestId
                        })
                    })
                        .then((res) => {
                            if (res.status === 200) {
                                return res.json();
                            }
                        })
                        .then((object) => {
                            if (object.message === "PENDING_REQUEST_DELETE_ERROR") {
                                toast.error('An error has occurred', {
                                    position: "bottom-right",
                                    autoClose: 5000,
                                    hideProgressBar: false,
                                    closeOnClick: true,
                                    pauseOnHover: true,
                                    draggable: true,
                                    progress: undefined,
                                });
                            }
                            else if (object.message === "PENDING_REQUEST_DELETE_OK") {
                                setStatus("FALSE");
                                toast.success('Request withdrawn successfully', {
                                    position: "bottom-right",
                                    autoClose: 5000,
                                    hideProgressBar: false,
                                    closeOnClick: true,
                                    pauseOnHover: true,
                                    draggable: true,
                                    progress: undefined,
                                });
                                global.socketUser.current.emit("withdrawn", {
                                    recipientUser: props.id,
                                    pendingRequestId: idPendingRequest
                                })
                            }
                        })
                }
            })
    }

    function handleRequestReceived(event) {
        event.preventDefault();
        fetch(`${API_BASE_URL}/tokenApi/manageUsers/sendFriendRequest`, {
            method: "POST",
            headers: new Headers({
                "Content-Type": "application/json",
                token: sessionStorage.getItem("token"),
            }),
            body: JSON.stringify({
                userId: event.target.id,
            })
        })
            .then((res) => {
                if (res.status === 200) {
                    return res.json();
                }
            })
            .then((obj) => {
                if (obj.message === "SEND_FRIEND_REQUEST_ERROR") {
                    toast.info('Check your notifications', {
                        position: "bottom-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                }
                else if (obj.message === "ALREADY_FRIEND") {
                    toast.warn('Already friend', {
                        position: "bottom-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                }
                else if (obj.message === "ALREADY_REQUEST") {
                    toast.error('Already request', {
                        position: "bottom-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                }
                else if (obj.message === "SEND_FRIEND_REQUEST_OK") {
                    setStatus("ALREADY_REQUEST");
                    toast.success('Request sent successfully', {
                        position: "bottom-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                }
                else {
                    toast.error('An error has occurred', {
                        position: "bottom-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                }
            })
    }

    return (
        <>
            <div className="single-user" id={props.id}>
                <div className="left-container">
                    <div className="foto-status">
                        <img src={props.profilePictureURL} alt="photo" className="user-foto" />
                    </div>
                    <div className="info-message">
                        <span className="username-message">{props.username}</span>
                        {props.email && <span className="text-message">{props.email}</span>}
                    </div>
                </div>
                <div className="right-container">
                    {(() => {
                        switch (statusRequest) {
                            case "ALREADY_REQUEST":
                                return <button id={props.id} className="btn-already" onClick={handleWithdrawn}>Withdrawn</button>;
                            case "ALREADY_REQUEST_SENT":
                                return <button id={props.id} className="btn-already" onClick={handleWithdrawn}>Withdrawn</button>;
                            case "ALREADY_REQUEST_RECEIVED":
                                return <button id={props.id} className="btn-send" onClick={handleRequestReceived}>Request</button>;
                            case "ALREADY_FRIEND":
                                return <button id={props.id} className="btn-send" onClick={(event) => props.handleOpenChat(event, props.id)}>Chat</button>;
                            case "FALSE":
                                return <button id={props.id} className="btn-send" onClick={handleRequest}>Request</button>;
                            default:
                                return <button id={props.id} className="btn-send" onClick={handleRequest}>Request</button>;
                        }
                    })()}
                    <button id={props.id} className="btn-view" onClick={handleProfile}>Profile</button>
                </div>
            </div>
        </>
    );
}

export default UserSearch;