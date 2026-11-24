import { useEffect, useState } from "react";

function AudioChatSender(props) {
    const [audioUrl, setAudioUrl] = useState("");

    useEffect(() => {
        let active = true;
        let objectUrl;
        const controller = new AbortController();
        fetch(props.url, {
            method: "GET",
            signal: controller.signal,
            headers: new Headers({
                token: sessionStorage.getItem("token"),
            }),
        })
            .then((res) => {
                if (res.status === 200) {
                    return res.blob();
                }
            })
            .then((blob) => {
                if (active && blob) {
                    objectUrl = URL.createObjectURL(blob);
                    setAudioUrl(objectUrl);
                }
            })
        .catch(() => {});
        return () => {
            active = false;
            controller.abort();
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [props.url])

    return (
        <div className="message-chat sender">
            <audio src={audioUrl} className="text-chat senderMsg aud" controls />
        </div>
    );
}

export default AudioChatSender;