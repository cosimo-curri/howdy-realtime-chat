import AudioChatSender from "./AudioChatSender";
import ImageChatSender from "./ImageChatSender";
import TextChatSender from "./TextChatSender";
import VideoChatSender from "./VideoChatSender";

function MessageChatSender(props) {
    return (
        <div className="message-chat sender">
            {
                (props.message.type === "TEXT")
                    ? <TextChatSender message={props.message.message} />
                    : ((props.message.type === "IMAGE")
                        ? <ImageChatSender url={props.message.message} />
                        : (props.message.type === "VIDEO")
                            ? <VideoChatSender url={props.message.message} />
                            : <AudioChatSender url={props.message.message} />
                    )
            }
        </div>
    );
}

export default MessageChatSender;