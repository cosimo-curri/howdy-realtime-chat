import { useEffect, useState } from "react";
import SingleMessage from "./SingleMessage";
import moment from 'moment';
import 'moment-timezone';
import 'react-toastify/dist/ReactToastify.css';

function ListMessages(props) {
    const [listChats, setListChats] = useState(props.listChats);

    function serverDateToItaly(serverDate) {
        const momentData = moment(serverDate).tz("Europe/Rome");
        const dataOraItalia = momentData.format("YYYY-MM-DD HH:mm");
        return dataOraItalia;
    }

    useEffect(() => {
        setListChats(props.listChats);
    }, [props.listChats])

    return (
        <>
            <div className="list-messages">
                {listChats.map((chat) => {
                    const currentDate = moment();
                    const lastAccess = serverDateToItaly(chat.partecipants[0].lastAccess);
                    const minuteDiff = currentDate.diff(lastAccess, "minutes");
                    {
                        if (minuteDiff >= 3) {
                            return <SingleMessage listChats={listChats} key={chat._id} chat={chat} handle={props.handle} online={false} />
                        }
                        else {
                            return <SingleMessage listChats={listChats} key={chat._id} chat={chat} handle={props.handle} online={true} />
                        }
                    }
                }
                )}
            </div>
        </>
    );
}

export default ListMessages;