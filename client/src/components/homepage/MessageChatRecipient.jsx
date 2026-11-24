import AudioChatRecipient from "./AudioChatRecipient";
import ImageChatRecipient from "./ImageChatRecipient";
import TextChatRecipient from "./TextChatRecipient";
import VideoChatRecipient from "./VideoChatRecipient";

function MessageChatRecipient(props) {
    return (
        <div className="message-chat recipient">
            {
                (props.message.type === "TEXT")
                ? <TextChatRecipient message={props.message.message} />
                : ((props.message.type === "IMAGE")
                        ? <ImageChatRecipient url={props.message.message} />
                        : (props.message.type === "VIDEO")
                            ? <VideoChatRecipient url={props.message.message} />
                            : <AudioChatRecipient url={props.message.message} />
                    )
            }
        </div>
    );
}

export default MessageChatRecipient;
