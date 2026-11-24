import { API_BASE_URL } from "../../config";
import { useEffect } from "react";
import { useState } from "react";
import OverHeader from "./OverHeader";
import Notify from "./Notify";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


function OverNotify(props) {
    const [listNotifications, setListNotifications] = useState(props.listNotifications);

    useEffect(() => {
        setListNotifications(props.listNotifications)
    }, [props.listNotifications])

    useEffect(() => {
        fetch(`${API_BASE_URL}/tokenApi/manageUsers/getPendingFriendRequests`, {
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
                if (obj === "FIND_PENDING_REQUESTS_QUERY_ERROR") {
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
                    props.handleListNotifications(obj);
                }
            })
    }, []);

    return (
        <>
            <div className="over-page notify">
                <OverHeader name="Notifications" />
                <div className="list-users">
                    {listNotifications.map((user) => {
                        return <Notify
                            id={user._id}
                            key={user.senderUser._id}
                            username={user.senderUser.username}
                            email={user.senderUser.email}
                            profilePictureURL={user.senderUser.profilePictureURL}
                            handle={props.handleListFilter}
                        />
                    })}
                </div>
            </div>
        </>

    );
}

export default OverNotify;