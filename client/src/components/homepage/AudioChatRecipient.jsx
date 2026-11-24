import { useEffect, useState } from "react";
import gif from "../../imgs/loading.gif"

function AudioChatRecipient(props) {
    const [audioUrl, setAudioUrl] = useState(gif);

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
        <div className="message-chat recipient">
            <audio src={audioUrl} className="text-chat recipientMsg aud" controls />
        </div>
    );
}

export default AudioChatRecipient;