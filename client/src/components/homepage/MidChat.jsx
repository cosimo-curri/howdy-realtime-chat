import MessageChatRecipient from "./MessageChatRecipient";
import MessageChatSender from "./MessageChatSender";
import { useEffect, useRef } from "react";

function MidChat(props) {
    const scrollRef = useRef(null);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [props.newMessages]);



    return (
        <div className="mid-chat">
            {("chats" in props.chatActive)
                ? (props.chatActive.chats[0].messages.map((message) => {
                    return message.senderUser._id === JSON.parse(sessionStorage.getItem("infoLoggedUser"))._id
                        ? (<MessageChatSender message={message} key={message._id} />)
                        : (<MessageChatRecipient message={message} key={message._id} />);
                }))
                : null}
            {
                props.newMessages.map((message) => {
                    return message.senderUser === JSON.parse(sessionStorage.getItem("infoLoggedUser"))._id ? (
                        <MessageChatSender message={message} key={message._id} />
                    ) : (
                        <MessageChatRecipient message={message} key={message._id} />
                    );
                })
            }
            <div className="scroll-ref" ref={scrollRef}></div>
        </div>
    );
}

export default MidChat;