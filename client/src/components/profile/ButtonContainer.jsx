import { API_BASE_URL } from "../../config";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';


function ButtonContainer(props) {
    const navigate = useNavigate();
    const [statusRequest, setStatus] = useState(props.request.message);

    function handleRequest(event) {
        event.preventDefault();
        fetch(`${API_BASE_URL}/tokenApi/manageUsers/sendFriendRequest`, {
            method: "POST",
            headers: new Headers({
                "Content-Type": "application/json",
                token: sessionStorage.getItem("token"),
            }),
            body: JSON.stringify({
                userId: props.profileUser._id,
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
                    global.socketUser.current.emit("sendFriendRequest", {
                        _id: obj.pendingRequest._id,
                        recipientUserSocket: props.profileUser._id,
                        date: obj.pendingRequest.date,
                        recipientUser: {
                            _id: props.profileUser._id,
                            username: props.profileUser.username,
                            email: props.profileUser.mail,
                            profilePictureURL: props.profileUser.profilePictureURL
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

    function handleHome() {
        sessionStorage.removeItem("profileUser");
        navigate("/homepage");
    }

    function handleRemove(event) {
        event.preventDefault();
        fetch(`${API_BASE_URL}/tokenApi/manageUsers/deleteFriend`, {
            method: "DELETE",
            headers: new Headers({
                "Content-Type": "application/json",
                token: sessionStorage.getItem("token"),
            }),
            body: JSON.stringify({
                userId: props.profileUser._id,
            })
        })
            .then((res) => {
                if (res.status === 200) {
                    return res.json();
                }
            })
            .then((obj) => {
                if (obj.message === "FRIENDSHIP_DELETE_ERROR") {
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
                else if (obj.message === "FRIENDSHIP_DELETE_OK") {
                    setStatus("FALSE");
                    toast.success('Friendship successfully removed', {
                        position: "bottom-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                    global.socketUser.current.emit("notifyDeleteFriend", {
                        recipientUser: props.profileUser._id
                    })
                }
            })
    }

    function handleWithdrawn(event) {
        event.preventDefault();
        fetch(`${API_BASE_URL}/tokenApi/manageUsers/getUserByUsername/` + props.profileUser.username, {
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
                if (obj.message === "FIND_USER_QUERY_ERROR") {
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
                                    recipientUser: props.profileUser._id,
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
                userId: props.profileUser._id,
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

    useEffect(() => {
        setStatus(props.request.message);
    }, [props.request.message])

    return (
        <>
            <div className="button-user-container">
                <button className="homepage" onClick={handleHome}>Homepage</button>
                {(() => {
                    switch (statusRequest) {
                        case "ALREADY_REQUEST":
                            return <button className="btn-already" onClick={handleWithdrawn}>Withdrawn</button>;
                        case "ALREADY_REQUEST_SENT":
                            return <button id={props.id} className="btn-already" onClick={handleWithdrawn}>Withdrawn</button>;
                        case "ALREADY_REQUEST_RECEIVED":
                            return <button className="request" onClick={handleRequestReceived}>Request</button>;
                        case "ALREADY_FRIEND":
                            return <button onClick={handleRemove} className="remove">Remove</button>;
                        case "FALSE":
                            return <button onClick={handleRequest} className="request">Request</button>;
                        default:
                            return <button onClick={handleRequest} className="request">Request</button>;
                    }
                })()}
            </div>
        </>
    );
}

export default ButtonContainer;