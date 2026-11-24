import { useEffect, useState } from "react";

function TextChatSender(props) {
    const [message, setMessage] = useState(props.message);

    useEffect(() => {
        if(props.message.startsWith("www.")) {
            setMessage("https://" + props.message);
        }
    }, []);

    return (
        <>
            {
                (props.message.startsWith("http://") || props.message.startsWith("https://") || props.message.startsWith("www.")) 
                ? <a href={message} target="_blank" className="text-chat senderMsg">{props.message}</a>
                : <p className="text-chat senderMsg">{props.message}</p>
            }
        </>
    );
}

export default TextChatSender;