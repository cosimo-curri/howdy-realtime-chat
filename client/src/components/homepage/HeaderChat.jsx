import { useEffect, useState } from "react";
import moment from 'moment';
import 'moment-timezone';

function HeaderChat(props) {
    const [onlineStatus, setOnlineStatus] = useState("");

    useEffect(() => {      
        const currentDate = moment();
        let lastAccess = serverDateToItaly(props.chatActive.chats[0].partecipants[0].lastAccess);
        const timeDiff = currentDate.diff(lastAccess, "minutes");
        if (timeDiff >= 3) {
            setOnlineStatus(`Last access: ${lastAccess}`);
        }
        else {
            setOnlineStatus("Online");
        }
    }, [props.chatActive.chats[0].partecipants[0].lastAccess]);

    function serverDateToItaly(serverDate) {
        const momentData = moment(serverDate).tz("Europe/Rome");
        const dataOraItalia = momentData.format("YYYY-MM-DD HH:mm");
        return dataOraItalia;
    }

    return (
        <div className="header-chat">
            <div className="foto-status">
                {
                    (("chats" in props.chatActive))
                        ? <img src={props.chatActive.chats[0].partecipants[0].profilePictureURL} className="user-foto" />
                        : null
                }
            </div>
            <div className="info-message">
                {
                    (("chats" in props.chatActive))
                        ? <span className="username-message">{props.chatActive.chats[0].partecipants[0].username}</span>
                        : null
                }
                {
                    (("chats" in props.chatActive))
                        ? <span id="status-online-offline" className="text-message">{onlineStatus}</span>
                        : null
                }
            </div>
        </div>
    );
}

export default HeaderChat;