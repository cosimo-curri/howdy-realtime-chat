import { API_BASE_URL } from "../config";
import { useEffect } from "react";
import ButtonContainer from "../components/profile/ButtonContainer";
import HeaderInfo from "../components/profile/HeaderInfo";
import SecondInformation from "../components/profile/SecondInformation";
import SocialContainer from "../components/profile/SocialContainer";
import "../styles/Profile.css";
import { useState } from "react";
import 'react-toastify/dist/ReactToastify.css';

function ProfileUser() {
    const [profileUser, setProfileUSer] = useState(JSON.parse(sessionStorage.getItem("profileUser")));
    const [friendStatus, setFriendStatus] = useState(JSON.parse(sessionStorage.getItem("profileUser")).isAlreadyFriendOrRequest);

    if (global.socket) {
        global.socket.current.disconnect();
    }

    useEffect(() => {
        const infoLoggedUser = JSON.parse(sessionStorage.getItem("infoLoggedUser"));
        const body = document.querySelector("body");
        
        if (infoLoggedUser.darkTheme) {
            body.classList.add("dark");
        }
        else {
            body.classList.remove("dark");
        }
        fetch(`${API_BASE_URL}/tokenApi/manageUsers/getUserById/` + profileUser._id, {
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
                if (obj !== "FIND_USER_QUERY_ERROR") {
                    setProfileUSer(obj);
                    setFriendStatus(obj.isAlreadyFriendOrRequest)
                }
            })
    }, []);

    return (
        <>
            <div className="container-all">
                <div className="container-user">
                    <img src={profileUser.profilePictureURL} alt="profile" />
                    <div className="container-info">
                        <HeaderInfo profileUser={profileUser} />
                        <SecondInformation username={profileUser.username} email={profileUser.email} />
                        <SocialContainer />
                        <ButtonContainer profileUser={profileUser} request={friendStatus} />
                    </div>
                </div>
            </div>
        </>

    );
}

export default ProfileUser;