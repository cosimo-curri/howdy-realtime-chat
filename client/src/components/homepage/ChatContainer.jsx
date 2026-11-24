import FooterChat from "./FooterChat";
import HeaderChat from "./HeaderChat";
import MidChat from "./MidChat";

function ChatContainer(props) {
    return (
        <div className="chat-container">
            <HeaderChat chatActive={props.chatActive} />
            <MidChat newMessages={props.newMessages} chatActive={props.chatActive} />
            <FooterChat showEmojiPicker={props.showEmojiPicker} handlePopupEmoji={props.handlePopupEmoji} addAudioElement={props.addAudioElement} messageText={props.messageText} handleMessageText={props.handleMessageText} chatActive={props.chatActive} insertText={props.insertText} handleImage={props.handleImage} />
        </div>
    );
}

export default ChatContainer;