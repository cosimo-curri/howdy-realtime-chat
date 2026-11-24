import { API_BASE_URL } from "../../config";
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import moment from 'moment';
import 'moment-timezone';


function SingleMessage(props) {
    const [lastMessage, setLastMessage] = useState(null);
    const [dataOra, setDataOra] = useState(null);
    const [senderMessage, setSenderMessage] = useState(true);
    const [checkExists, setCheckExists] = useState(false);
    const [checkToggle, setCheckToggle] = useState(false);

    function handleOpenChat(event) {
        event.preventDefault();
        if (props.listChats.length > 0) {
            props.listChats.forEach((chat) => {
                if (chat._id === props.chat._id && props.chat.messages[0]) {
                    document.querySelector(`#toggle-${chat._id}`).classList.remove("visible");
                    const dataJson = JSON.parse(localStorage.getItem(JSON.parse(sessionStorage.getItem("infoLoggedUser")).email));
                    const newDataJson = dataJson;
                    dataJson.forEach((data, index) => {
                        if (data.chatId === chat._id) {
                            newDataJson[index].messageId = props.chat.messages[0]._id;
                        }
                    })
                    localStorage.setItem(JSON.parse(sessionStorage.getItem("infoLoggedUser")).email, JSON.stringify(newDataJson));
                }
            })
        }


        fetch(`${API_BASE_URL}/tokenApi/manageChats/getAllChatMessages/` + props.chat._id, {
            method: "GET",
            headers: new Headers({
                token: sessionStorage.getItem("token"),
            }),
        })
            .then(res => {
                if (res.status === 200) {
                    return res.json();
                }
            })
            .then(obj => {
                if (obj.message === "GET_ALL_CHAT_MESSAGES_ERROR") {
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
                else if (obj.message === "GET_ALL_CHAT_MESSAGES_OK") {
                    props.handle(obj);
                }
            })
    }

    function serverDateToItaly(serverDate) {
        const momentData = moment(serverDate).tz("Europe/Rome");
        return momentData;
    }

    useEffect(() => {
        let check = false;
        if (props.chat.messages[0]) {
            setLastMessage(props.chat.messages[0].message);
            setDataOra(props.chat.messages[0].date);
            setCheckExists(true);
            check = true;

            if (props.chat.messages[0].senderUser._id === JSON.parse(sessionStorage.getItem("infoLoggedUser"))._id) {
                setSenderMessage(true);
            }
            else {
                setSenderMessage(false);
            }
        }
        else {
            check = false;
            setCheckExists(false);
        }
        if (check) {
            switch (props.chat.messages[0].type) {
                case "TEXT": setLastMessage(props.chat.messages[0].message); break;
                case "VIDEO": setLastMessage("sent a video"); break;
                case "IMAGE": setLastMessage("sent an image"); break;
                case "AUDIO": setLastMessage("sent an audio"); break;
            }
            const currentDate = moment().format("YYYY-MM-DD").toString();
            const messageDate = serverDateToItaly(props.chat.messages[0].date).format("YYYY-MM-DD").toString();
            const timeDate = serverDateToItaly(props.chat.messages[0].date).format("HH:mm").toString();
            (messageDate === currentDate) ? setDataOra(timeDate) : setDataOra(messageDate);
        }
    }, [props.chat.messages])

    useEffect(() => {
        let check = false;
        if (props.chat.messages[0]) {
            setLastMessage(props.chat.messages[0].message);
            setDataOra(props.chat.messages[0].date);
            setCheckExists(true);
            check = true;
            if (props.chat.messages[0].senderUser._id === JSON.parse(sessionStorage.getItem("infoLoggedUser"))._id) {
                setSenderMessage(true);
            }
            else {
                setSenderMessage(false);
            }
        }
        else {
            check = false;
            setCheckExists(false);
        }
        if (check) {
            switch (props.chat.messages[0].type) {
                case "TEXT": setLastMessage(props.chat.messages[0].message); break;
                case "VIDEO": setLastMessage("sent a video"); break;
                case "IMAGE": setLastMessage("sent an image"); break;
                case "AUDIO": setLastMessage("sent an audio"); break;
            }
            const currentDate = moment().format("YYYY-MM-DD").toString();
            const messageDate = serverDateToItaly(props.chat.messages[0].date).format("YYYY-MM-DD").toString();
            const timeDate = serverDateToItaly(props.chat.messages[0].date).format("HH:mm").toString();
            (messageDate === currentDate) ? setDataOra(timeDate) : setDataOra(messageDate);
            if (localStorage.getItem(JSON.parse(sessionStorage.getItem("infoLoggedUser")).email)) {
                const dataJson = JSON.parse(localStorage.getItem(JSON.parse(sessionStorage.getItem("infoLoggedUser")).email));
                dataJson.forEach((data) => {
                    if (data.chatId === props.chat._id && data.messageId !== props.chat.messages[0]._id) {
                        setCheckToggle(true);
                    }
                })
            }
        }
    }, [])

    return (
        <>
            <div className="single-message" onClick={handleOpenChat}>
                <div className="left-container">
                    <div className="foto-status">
                        <img src={props.chat.partecipants[0].profilePictureURL} className="user-foto" alt="photo" />
                        {
                            (props.online)
                                ? <div className="toggle-status"></div>
                                : <div className="toggle-status offline"></div>
                        }
                    </div>
                    <div className="info-message">
                        <span className="username-message">{props.chat.partecipants[0].username}
                            {
                                (checkToggle)
                                ? <div id={`toggle-${props.chat._id}`} className="toggle-new-messages visible"></div>
                                : <div id={`toggle-${props.chat._id}`} className="toggle-new-messages"></div>
                            }
                        </span>
                        {
                            (checkExists)
                                ? (senderMessage)
                                    ? <span className="text-message">Me: {lastMessage}</span>
                                    : <span className="text-message">{lastMessage}</span>
                                : <span className="text-message">There are no messages</span>
                        }
                    </div>
                </div>
                <div className="right-container">
                    {
                        (checkExists)
                            ? <span className="day-time-message">{dataOra}</span>
                            : null
                    }
                </div>
            </div>
        </>
    );
}

export default SingleMessage;