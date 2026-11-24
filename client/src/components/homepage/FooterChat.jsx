import { AudioRecorder } from "react-audio-voice-recorder";
import Picker from "emoji-picker-react";

function FooterChat(props) {
    const handleEmojiClick = (event) => {
        let text = props.messageText;
        text += event.emoji;
        props.handleMessageText(text);
    };

    function handleFocusEmoji() {
        if (props.showEmojiPicker) {
            props.handlePopupEmoji();
        }
    }

    return (
        <>
            <div className="footer-chat">
                <div className="form-message">
                    <AudioRecorder
                        onRecordingComplete={props.addAudioElement}
                        audioTrackConstraints={{
                            noiseSuppression: true,
                            echoCancellation: true,
                        }}
                        downloadOnSavePress={false}
                    />
                    <div className="btn-emoji" onClick={props.handlePopupEmoji}>
                        <i className="fa-regular fa-face-smile"></i>
                    </div>
                    <form action="#" onSubmit={(event) => props.insertText(event)}>
                        <input onFocus={handleFocusEmoji} value={props.messageText} type="text" placeholder="Type a message" className="input-message" onChange={(event) => props.handleMessageText(event.target.value)} />
                    </form>
                    <i onClick={props.handleImage} className="bx bx-image-alt icon photo-add"></i>
                </div>

            </div>
            {
                (props.showEmojiPicker) &&
                <div className="picker-emoji">
                    {
                        (JSON.parse(sessionStorage.getItem("infoLoggedUser")).darkTheme)
                            ? <Picker onEmojiClick={handleEmojiClick} theme="dark" />
                            : <Picker onEmojiClick={handleEmojiClick} theme="light" />
                    }
                </div>
            }
        </>
    );
}

export default FooterChat;