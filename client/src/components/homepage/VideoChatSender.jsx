import { useEffect, useState } from "react";
import gif from "../../imgs/200w.gif"

function VideoChatSender(props) {
    const [videoUrl, setVideoUrl] = useState(gif);

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
                    setVideoUrl(objectUrl);
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
            <video src={videoUrl} className="text-chat senderMsg img" controls />
        </div>
    );
}

export default VideoChatSender;