import { API_BASE_URL } from "../../config";
import { useEffect, useState } from "react";
import OverHeader from "./OverHeader";
import ModifyImage from "./ModifyImage";
import { toast } from 'react-toastify';
import moment from 'moment';
import 'moment-timezone';
import 'react-toastify/dist/ReactToastify.css';

function OverProfile(props) {
    const [firstName, setFirstName] = useState(props.infoLoggedUser.firstName);
    const [lastName, setLastName] = useState(props.infoLoggedUser.lastName);
    const [username, setUsername] = useState(props.infoLoggedUser.username);
    const [instagram, setInstagram] = useState("");
    const [facebook, setFacebook] = useState("");
    const [linkedin, setLinkedin] = useState("");
    const [birthday, setBirthday] = useState("");
    const [gender, setGender] = useState("");

    useEffect(() => {
        setFirstName(props.infoLoggedUser.firstName);
        setLastName(props.infoLoggedUser.lastName);
        setUsername(props.infoLoggedUser.username);

        if ("contacts" in (props.infoLoggedUser)) {
            if ("instagram" in (props.infoLoggedUser.contacts)) {
                setInstagram(props.infoLoggedUser.contacts.instagram);
            }

            if ("facebook" in (props.infoLoggedUser.contacts)) {
                setFacebook(props.infoLoggedUser.contacts.facebook);
            }

            if ("linkedin" in (props.infoLoggedUser.contacts)) {
                setLinkedin(props.infoLoggedUser.contacts.linkedin);
            }
        }

        if ("birthday" in (props.infoLoggedUser)) {
            setBirthday(props.infoLoggedUser.birthday.substring(0, 10));
        }

        if ("gender" in (props.infoLoggedUser)) {
            setGender(props.infoLoggedUser.gender);
        }
    }, [])

    function serverDateToItaly(serverDate) {
        const momentData = moment(serverDate).tz("Europe/Rome");
        const dataOraItalia = momentData.format("YYYY-MM-DD HH:mm");
        return dataOraItalia;
    }

    function handleUpdate(event) {
        event.preventDefault();
        let newInstagram = "";
        if (!instagram.startsWith("http://") && !instagram.startsWith("https://") && instagram.length > 0) {
            newInstagram = "https://" + instagram;
        }
        else {
            newInstagram = instagram;
        }
        let newFacebook = "";
        if (!facebook.startsWith("http://") && !facebook.startsWith("https://") && facebook.length > 0) {
            newFacebook = "https://" + facebook;
        }
        else {
            newFacebook = facebook;
        }
        let newLinkedin = "";
        if (!linkedin.startsWith("http://") && !linkedin.startsWith("https://") && linkedin.length > 0) {
            newLinkedin = "https://" + linkedin;
        }
        else {
            newLinkedin = linkedin;
        }
        fetch(`${API_BASE_URL}/tokenApi/profile/changeUserInfo`, {
            method: "PUT",
            headers: new Headers({
                "Content-Type": "application/json",
                token: sessionStorage.getItem("token"),
            }),
            body: JSON.stringify({
                firstName: firstName,
                lastName: lastName,
                username: username,
                instagram: newInstagram,
                facebook: newFacebook,
                linkedin: newLinkedin,
                birthday: serverDateToItaly(birthday),
                gender: gender,
            }),
        })
            .then((res) => {
                if (res.status === 200) {
                    return res.json();
                }
            })
            .then((obj) => {
                if (obj[0].message1 === "OTHER_FIELDS_OK") {
                    sessionStorage.setItem("infoLoggedUser", JSON.stringify(obj[2].userInfo));
                    props.handleUpdateInfo();
                    toast.success('Update successful', {
                        position: "bottom-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                    global.socketUser.current.emit("notifyUsernameChange", {
                        newUsername: username,
                    })
                    global.socketUser.current.emit("notifyProfilePictureChange", {
                        newProfilePictureURL: obj[2].userInfo.profilePictureURL,
                    })
                }
                else {
                    toast.error('Update failed', {
                        position: "bottom-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                }
                if (obj[2].userInfo.username !== JSON.parse(sessionStorage.getItem("infoLoggedUser")).username) {
                    if (obj[1].message2 === "USERNAME_OK") {
                        sessionStorage.setItem("infoLoggedUser", JSON.stringify(obj[2].userInfo));
                        props.handleUpdateInfo();
                        toast.success('Username update successful', {
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
                        toast.error('Username already in use', {
                            position: "bottom-right",
                            autoClose: 5000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                        });
                    }
                }
            })
    }

    function handleReset(event) {
        event.preventDefault();
        setFirstName(props.infoLoggedUser.firstName);
        setLastName(props.infoLoggedUser.lastName);
        setUsername(props.infoLoggedUser.username);

        if ("contacts" in (props.infoLoggedUser)) {
            if ("instagram" in (props.infoLoggedUser.contacts)) {
                setInstagram(props.infoLoggedUser.contacts.instagram);
            }
            else {
                setInstagram("");
            }

            if ("facebook" in (props.infoLoggedUser.contacts)) {
                setFacebook(props.infoLoggedUser.contacts.facebook);
            }
            else {
                setFacebook("");
            }

            if ("linkedin" in (props.infoLoggedUser.contacts)) {
                setLinkedin(props.infoLoggedUser.contacts.linkedin);
            }
            else {
                setLinkedin("");
            }
        }
        if ("birthday" in (props.infoLoggedUser)) {
            setBirthday(props.infoLoggedUser.birtday);
        }
        else {
            setBirthday("");
        }
        if ("gender" in (props.infoLoggedUser)) {
            setGender(props.infoLoggedUser.gender);
        }
        else {
            setGender("");
        }
    }

    function handleChange1(event) {
        setFirstName(event.target.value)
    }

    function handleChange2(event) {
        setLastName(event.target.value)
    }

    function handleChange3(event) {
        setUsername(event.target.value)
    }

    function handleChange4(event) {
        setInstagram(event.target.value)
    }

    function handleChange5(event) {
        setFacebook(event.target.value)
    }

    function handleChange6(event) {
        setLinkedin(event.target.value)
    }

    function handleBirthday(event) {
        setBirthday(event.target.value)
    }

    function handleGender(event) {
        setGender(event.target.value)
    }

    return (
        <>
            <div className="over-page profile">
                <OverHeader name="Profile" />
                <form action="#">
                    <ModifyImage handleImage={props.handleImage} infoLoggedUser={props.infoLoggedUser} />

                    <div className="info-profile">
                        <span>Edit Profile Information</span>
                        <div className="infield">
                            <input type="text" value={firstName} placeholder="Change first name" onChange={handleChange1} className="modify-user" />
                            <div className="label"></div>
                        </div>
                        <div className="infield">
                            <input type="text" value={lastName} placeholder="Change last name" onChange={handleChange2} className="modify-user" />
                            <div className="label"></div>
                        </div>
                        <div className="infield">
                            <input type="text" value={username} placeholder="Change username" onChange={handleChange3} className="modify-user" />
                            <div className="label"></div>
                        </div>
                    </div>
                    <div className="info-profile">
                        <span>Edit Personal Information</span>
                        <div className="infield">
                            <input type="date" className="modify-user" value={birthday} onChange={handleBirthday} />
                            <div className="label"></div>
                        </div>
                        <div className="containers-radio">
                            <div className="radio-container" id="male">
                                <input type="radio" id="gender" name="gender" value="M" onChange={handleGender} checked={gender === "M"} />
                                <span>Male</span>
                            </div>
                            <div className="radio-container" id="female">
                                <input type="radio" id="gender" name="gender" value="F" onChange={handleGender} checked={gender === "F"} />
                                <span>Female</span>
                            </div>
                        </div>
                    </div>
                    <div className="info-profile">
                        <span>Edit social links</span>
                        <div className="infield">
                            <input type="text" value={instagram} placeholder="Link Instagram" onChange={handleChange4} className="modify-user" />
                            <div className="label"></div>
                        </div>
                        <div className="infield">
                            <input type="text" value={facebook} placeholder="Link Facebook" onChange={handleChange5} className="modify-user" />
                            <div className="label"></div>
                        </div>
                        <div className="infield">
                            <input type="text" value={linkedin} placeholder="Link Linkedin" onChange={handleChange6} className="modify-user" />
                            <div className="label"></div>
                        </div>
                    </div>
                    <div className="button-profile-container">
                        <button className="btn-reset" onClick={handleReset}>Reset</button>
                        <button className="btn-view" onClick={handleUpdate}>Update</button>
                    </div>
                </form>
            </div>

        </>
    );
}

export default OverProfile;