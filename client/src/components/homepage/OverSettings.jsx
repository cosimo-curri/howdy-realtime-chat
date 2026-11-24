import { API_BASE_URL } from "../../config";
import { useEffect, useState } from "react";
import ChangePasswordBtn from "./ChangePasswordBtn";
import OverHeader from "./OverHeader";
import { useNavigate } from "react-router-dom";


function OverSettings(props) {
    const navigate = useNavigate();
    const [status2FA, setStatus2FA] = useState(false);

    useEffect(() => {
        fetch(`${API_BASE_URL}/tokenApi/profile/loggedUserAuth2FA`, {
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
                if (obj.message === "AUTH_2FA_NO") {
                    setStatus2FA(false);
                }
                else if (obj.message === "AUTH_2FA_YES") {
                    setStatus2FA(true);
                }
            })
    }, []);

    function handleChangePassword() {
        navigate("/changePassword");
    }

    return (
        <div className="over-page settings">
            <OverHeader name="Settings" />
            <div className="content-settings">
                <div className="tfa">
                    <span className="text-tfa">Two Factor Authentication</span>
                    {
                        (status2FA)
                            ? <button className="btn-tfa actived">Actived</button>
                            : <button className="btn-tfa disabled">Disabled</button>
                    }
                </div>
                <div className="tfa">
                    <span className="text-tfa">Audio Notifications</span>
                    {
                        (props.audioNotifications)
                            ? <button onClick={props.handleAudioNotifications} className="btn-tfa actived audio">Actived</button>
                            : <button onClick={props.handleAudioNotifications} className="btn-tfa disabled audio">Disabled</button>
                    }
                </div>
                {(JSON.parse(sessionStorage.getItem('infoLoggedUser')).signupMethod.local) ? <ChangePasswordBtn handleChangePassword={handleChangePassword} /> : null}
            </div>
        </div>
    );
}

export default OverSettings;