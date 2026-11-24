import { API_BASE_URL } from "../config";
import { useEffect, useState, useRef } from "react";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import io from "socket.io-client";
import OverSearch from "../components/homepage/OverSearch";
import Navbar from "../components/homepage/Navbar";
import OverNotify from "../components/homepage/OverNotify";
import OverProfile from "../components/homepage/OverProfile";
import OverSettings from "../components/homepage/OverSettings";
import ListMessages from "../components/homepage/ListMessages";
import ChatContainer from "../components/homepage/ChatContainer";
import EmptyChat from "../components/homepage/EmptyChat";
import PopupImage from "../components/homepage/PopupImage";
import PopupMedia from "../components/homepage/PopupMedia";
import moment from 'moment';
import 'moment-timezone';
import "../styles/Home.css";
import gif from "../imgs/loading.gif";
import { useNavigate } from "react-router-dom";
import alertNotify from "../audio/notify.mp3";

function Homepage(props) {
    const [infoLoggedUser, setInfoLoggedUser] = useState(JSON.parse(sessionStorage.getItem("infoLoggedUser")));
    const [textSearch, setTextSearch] = useState("");
    const [listUserSearch, setListUserSearch] = useState([]);
    const [activeChat, setActiveChat] = useState({});
    const [newMessages, setNewMessages] = useState([]);
    const [popupProfile, setPopupProfile] = useState(false);
    const [popupMedia, setPopupMedia] = useState(false);
    const [useBoolean, setUseBoolean] = useState(false);
    const [useBooleanUser, setUseBooleanUser] = useState(false);
    const [listChats, setListChats] = useState([]);
    const [listNotifications, setListNotifications] = useState([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [audioNotifications, setAudioNotifications] = useState(true);

    const audio = new Audio(alertNotify);

    const [messageText, setMessageText] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const navigate = useNavigate();

    const activeChatRef = useRef(activeChat);
    const listChatsRef = useRef(listChats);
    const messageTextRef = useRef({ messageText: messageText });
    const newMessagesRef = useRef(newMessages);
    global.socket = useRef(null);
    global.socketUser = useRef(null);
    const listNotificationsRef = useRef(listNotifications);
    const audioNotificationsRef = useRef(audioNotifications);

    function handleListNotifications(newList) {
        setListNotifications(newList);
    }

    function handleListFilter(id) {
        setListNotifications(listNotificationsRef.current.filter((notify) => (notify._id !== id)));
    }

    function handleUpdateInfo() {
        setInfoLoggedUser(JSON.parse(sessionStorage.getItem("infoLoggedUser")))
    }

    function handlePopupEmoji() {
        setShowEmojiPicker(!showEmojiPicker);
    }

    function handleMessageText(text) {
        setMessageText(text);
        let isWriting = false;
        if (document.querySelector(".input-message").value !== "") {
            isWriting = true;
        }
        else {
            isWriting = false;
        }
        global.socket.current.emit("notifyUserStatus", {
            recipientUser: activeChat.chats[0].partecipants[0]._id,
            isWriting: isWriting,
            chatId: activeChat.chats[0]._id
        });
    }

    useEffect(() => {
        messageTextRef.current = { messageText: messageText };
    }, [messageText]);

    useEffect(() => {
        audioNotificationsRef.current = audioNotifications;
    }, [audioNotifications]);

    function serverDateToItaly(serverDate) {
        const momentData = moment(serverDate).tz("Europe/Rome");
        const dataOraItalia = momentData.format("YYYY-MM-DD HH:mm");
        return dataOraItalia;
    }

    useEffect(() => {
        newMessagesRef.current = newMessages;
    }, [newMessages]);

    useEffect(() => {
        activeChatRef.current = activeChat;
    }, [activeChat]);

    useEffect(() => {
        listNotificationsRef.current = listNotifications;
        if (listNotifications.length > 0) {
            document.querySelector(".toggle-notify").classList.add("pending");
        }
        else {
            document.querySelector(".toggle-notify").classList.remove("pending");

        }
    }, [listNotifications]);

    useEffect(() => {
        listChatsRef.current = listChats;
    }, [listChats]);

    function updateListChatsMessageByChatId(chatId, message, date, type, senderUserId, messageId) {
        let chatIndex = null;
        let updatedListChats = [...listChatsRef.current];
        let temp = updatedListChats.map((chat, index) => {
            if (chat._id === chatId) {
                chatIndex = index;
                return {
                    ...chat,
                    _id: chatId,
                    messages: [{
                        ...chat.messages[0],
                        _id: messageId,
                        message: message,
                        date: date,
                        type: type,
                        senderUser: {
                            _id: senderUserId
                        }
                    }]
                };
            }
            return chat;
        });

        if (chatIndex) {
            const listChatsTemp = [...temp];
            const chatTemp = listChatsTemp[chatIndex];
            listChatsTemp.splice(chatIndex, 1);
            listChatsTemp.unshift(chatTemp);

            setListChats([...listChatsTemp]);
        } else
            setListChats([...temp]);
    }

    function updateListChatsUserLastAccessByUserId(userId, lastAccess) {
        const updatedListChats = listChatsRef.current.map(chat => {
            if (chat.partecipants[0]._id === userId) {
                return {
                    ...chat,
                    partecipants: [{
                        ...chat.partecipants[0],
                        lastAccess: lastAccess
                    }]
                };
            }
            return chat;
        });
        setListChats(updatedListChats);
    }

    function handleSubmitTextMessage(event) {
        event.preventDefault();
        let checkEmptySpace = false;
        for (let i = 0; i < messageText.length; i++) {
            if (messageText[i] !== " ") {
                checkEmptySpace = true;
            }
        }
        if (checkEmptySpace) {
            setMessageText("");
            document.querySelector(".input-message").value = "";
            if (showEmojiPicker) {
                handlePopupEmoji();
            }
            if (("chats" in activeChat)) {
                fetch(`${API_BASE_URL}/tokenApi/manageChats/insertMessage`, {
                    method: "POST",
                    headers: new Headers({
                        token: sessionStorage.getItem("token"),
                        "Content-Type": "application/json",
                    }),
                    body: JSON.stringify({
                        chatId: activeChat.chats[0]._id,
                        message: messageText
                    })
                })
                    .then(res => {
                        if (res.status === 200) {
                            return res.json();
                        }
                    })
                    .then(obj => {
                        if (obj.message === "INSERT_MESSAGE_OK") {
                            const provissorioArr = [...newMessages];
                            provissorioArr.push(obj.messageDB);
                            setNewMessages(provissorioArr);

                            let dataJson = [];
                            let newDataJson = [];

                            if (localStorage.getItem(JSON.parse(sessionStorage.getItem("infoLoggedUser")).email)) {
                                dataJson = JSON.parse(localStorage.getItem(JSON.parse(sessionStorage.getItem("infoLoggedUser")).email));
                                newDataJson = dataJson;

                                let checkJson = false;
                                dataJson.forEach((data, index) => {
                                    if (data.chatId === activeChatRef.current.chats[0]._id) {
                                        newDataJson[index].messageId = obj.messageDB._id;
                                        checkJson = true;
                                    }
                                })
                                
                                if (!checkJson) {
                                    newDataJson.push(
                                        {
                                            chatId: activeChatRef.current.chats[0]._id,
                                            messageId: obj.messageDB._id,
                                        }
                                    )
                                }
                            }
                            else {
                                dataJson = [{
                                    chatId: activeChatRef.current.chats[0]._id,
                                    messageId: obj.messageDB._id,
                                }]
                            }


                            localStorage.setItem(JSON.parse(sessionStorage.getItem("infoLoggedUser")).email, JSON.stringify(dataJson));

                            global.socket.current.emit("sendMessage", {
                                recipientUser: activeChat.chats[0].partecipants[0]._id,
                                message: obj.messageDB.message,
                                date: serverDateToItaly(obj.messageDB.date),
                                type: obj.messageDB.type,
                                _id: obj.messageDB._id,
                                chatId: obj.chatId
                            });
                            updateListChatsMessageByChatId(obj.chatId, obj.messageDB.message, obj.messageDB.date, obj.messageDB.type, JSON.parse(sessionStorage.getItem("infoLoggedUser"))._id, obj.messageDB._id);
                        }
                        else {
                            toast.error('An error has occurred', {
                                position: "bottom-right",
                                autoClose: 5000,
                                hideProgressBar: false,
                                closeOnClick: true,
                                pauseOnHover: true,
                                draggable: true,
                                progress: undefined,
                            });
                        }
                    })
            }
        }
    }

    function handleChangeSearch(event) {
        event.preventDefault();
        setTextSearch(event.target.value);
    }

    function handleActiveChat(obj) {
        setActiveChat(obj);
        setNewMessages([]);
    }

    function handleAudioNotifications() {
        setAudioNotifications(!audioNotifications);
    }

    useEffect(() => {
        global.socket.current = io(`${API_BASE_URL}/socket/chat`, {
            query: `token=${sessionStorage.getItem("token")}`,
        })
        global.socketUser.current = io(`${API_BASE_URL}/socket/user`, {
            query: `token=${sessionStorage.getItem("token")}`,
        })
        const imgLoading = document.createElement("img");
        imgLoading.src = gif;
        imgLoading.className = "imgLoadingList";
        document.querySelector(".list-messages").appendChild(imgLoading);

        fetch(`${API_BASE_URL}/tokenApi/manageChats/getAllChats`, {
            method: "GET",
            headers: new Headers({
                token: sessionStorage.getItem("token"),
            }),
        })
            .then(res => {
                if (res.status === 200) {
                    return res.json();
                }
            })
            .then(obj => {
                if (obj.message === "GET_ALL_CHATS_ERROR") {
                    toast.error('An error has occurred', {
                        position: "bottom-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                }
                else if (obj.message === "GET_ALL_CHATS_OK") {
                    if (document.querySelector(".imgLoadingList")) {
                        document.querySelector(".imgLoadingList").remove();
                    }
                    setListChats(obj.chats);

                    let dataJson = [];
                    if (!localStorage.getItem(JSON.parse(sessionStorage.getItem("infoLoggedUser")).email)) {
                        obj.chats.forEach((chat) => {
                            dataJson.push({
                                chatId: chat._id,
                                messageId: ""
                            })
                        })
                        localStorage.setItem(JSON.parse(sessionStorage.getItem("infoLoggedUser")).email, JSON.stringify(dataJson));
                    }
                    global.socket.current.emit("notifyUserStatus", {
                        recipientUser: "*"
                    })
                }
            })
            if(JSON.parse(sessionStorage.getItem("infoLoggedUser")).darkTheme) {
                props.handleColorTheme("dark");
            }
            else {
                props.handleColorTheme("light");
            }
    }, []);

    useEffect(() => {
        setUseBooleanUser(!useBooleanUser);
        if (useBooleanUser) {

            global.socketUser.current.on("receiveFriendRequest", (data) => {
                const temp = [data, ...listNotificationsRef.current];
                setListNotifications(temp);
                toast.info(`${data.senderUser.username} has sent you a request`, {
                    position: "bottom-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
            })

            global.socketUser.current.on("receiveNewFriendOffline", (data) => {
                if (activeChatRef.current.chats) {
                    if (activeChatRef.current.chats[0].partecipants[0]._id === data.userId) {
                        const dataMoment = serverDateToItaly(new Date(data.lastAccess));
                        document.querySelector("#status-online-offline").textContent = `Last access: ${dataMoment.toString()}`;
                    }
                }
                updateListChatsUserLastAccessByUserId(data.userId, data.lastAccess);
            })

            global.socketUser.current.on("receiveWithdrawn", (data) => {
                handleListFilter(data.pendingRequestId);
            })

            global.socketUser.current.on("receiveNotifyUsernameChange", (data) => {
                let temp = [...listChatsRef.current];
                temp.map((chat) => {
                    if (chat.partecipants[0]._id === data.userId) {
                        chat.partecipants[0].username = data.newUsername;
                    }
                })
                setListChats([...temp]);
            })

            global.socketUser.current.on("receiveNotifyProfilePictureChange", (data) => {
                let temp = [...listChatsRef.current];
                temp.map((chat) => {
                    if (chat.partecipants[0]._id === data.userId) {
                        chat.partecipants[0].profilePictureURL = data.newProfilePictureURL;
                    }
                })
                setListChats([...temp]);
            })

            global.socketUser.current.on("receiveNotifyDeleteFriend", (data) => {
                setListChats(listChatsRef.current.filter((chat) => (chat.partecipants[0]._id !== data.userId)));
                if (activeChatRef.current.chats) {
                    if (activeChatRef.current.chats[0].partecipants[0]._id === data.userId) {
                        setActiveChat({});
                    }
                }
            })
        }
    }, [global.socketUser.current]);

    function handleLogout(event) {
        event.preventDefault();
        fetch(`${API_BASE_URL}/api/logout`, {
            method: "GET",
            headers: new Headers({
                token: sessionStorage.getItem("token"),
            }),
        })
            .then((res) => {
                if (res.status === 200) {
                    return res.json();
                }
            })
            .then((obj) => {
                if (obj.message === "LOGOUT_OK") {
                    global.socketUser.current.emit("newFriendOffline");
                    sessionStorage.clear();
                    navigate("/");
                }
                else {
                    toast.error('An error has occurred', {
                        position: "bottom-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                }
            })
    }

    useEffect(() => {
        setUseBoolean(!useBoolean);
        if (useBoolean) {
            if (global.socket.current) {

                global.socket.current.on("receiveNewFriendOnline", (data) => {
                    if (activeChatRef.current.chats) {
                        if (activeChatRef.current.chats[0].partecipants[0]._id === data.userId) {
                            document.querySelector("#status-online-offline").textContent = "Online";
                        }
                    }
                    updateListChatsUserLastAccessByUserId(data.userId, data.lastAccess);
                })

                global.socket.current.on("receiveNotifyUserStatus", (data) => {
                    if ("chats" in activeChatRef.current) {
                        if (data.chatId === activeChatRef.current.chats[0]._id) {
                            const currentDate = moment();
                            const lastAccess = moment(data.lastAccess);
                            const timeDiff = currentDate.diff(lastAccess, "minutes");
                            if (timeDiff >= 3) {
                                document.querySelector("#status-online-offline").textContent = `Last access: ${lastAccess.format("DD-MM-YYYY HH:mm")}`;
                            }
                            else {
                                document.querySelector("#status-online-offline").textContent = "Online";
                            }
                            if (data.isWriting) {
                                document.querySelector("#status-online-offline").textContent = "is writing...";
                            }
                        }
                    }
                });

                global.socket.current.on("receiveNewChat", (data) => {
                    let checkExist = false;
                    listChatsRef.current.forEach((chat) => {
                        if (chat._id === data._id) {
                            checkExist = true;
                        }
                    })
                    if (!checkExist) {
                        const temp = [data, ...listChatsRef.current];
                        setListChats(temp);
                        let dataJson = JSON.parse(localStorage.getItem(JSON.parse(sessionStorage.getItem("infoLoggedUser")).email));
                        dataJson.push(
                            {
                                chatId: data._id,
                                messageId: "",
                            }
                        )
                        localStorage.setItem(JSON.parse(sessionStorage.getItem("infoLoggedUser")).email, JSON.stringify(dataJson));
                    }
                })

                global.socket.current.on("receiveMessage", (data) => {
                    if ("chats" in activeChatRef.current) {
                        if (data.chatId === activeChatRef.current.chats[0]._id) {
                            document.querySelector("#status-online-offline").textContent = "Online";
                            const provissorioArr = [...newMessagesRef.current];
                            provissorioArr.push(data);
                            setNewMessages(provissorioArr);

                            let dataJson = [];
                            let newDataJson = [];

                            if (localStorage.getItem(JSON.parse(sessionStorage.getItem("infoLoggedUser")).email)) {
                                dataJson = JSON.parse(localStorage.getItem(JSON.parse(sessionStorage.getItem("infoLoggedUser")).email));
                                newDataJson = dataJson;

                                let checkJson = false;
                                dataJson.forEach((element, index) => {
                                    if (element.chatId === data.chatId) {
                                        newDataJson[index].messageId = data._id;
                                        checkJson = true;
                                    }
                                })

                                if (!checkJson) {
                                    newDataJson.push(
                                        {
                                            chatId: data.chatId,
                                            messageId: data._id,
                                        }
                                    )
                                }

                            }
                            else {
                                dataJson = [{
                                    chatId: activeChatRef.current.chats[0]._id,
                                    messageId: data._id
                                }]
                            }
                            localStorage.setItem(JSON.parse(sessionStorage.getItem("infoLoggedUser")).email, JSON.stringify(dataJson));
                        }
                        else {
                            let dataJson = [];
                            let newDataJson = [];

                            if (localStorage.getItem(JSON.parse(sessionStorage.getItem("infoLoggedUser")).email)) {
                                dataJson = JSON.parse(localStorage.getItem(JSON.parse(sessionStorage.getItem("infoLoggedUser")).email));
                                newDataJson = dataJson;

                                let checkJson = false
                                dataJson.forEach((element, index) => {
                                    if (element.chatId === data.chatId) {
                                        newDataJson[index].messageId = "";
                                        checkJson = true;
                                    }
                                })
                                if (!checkJson) {
                                    newDataJson.push(
                                        {
                                            chatId: data.chatId,
                                            messageId: "",
                                        }
                                    )
                                }

                            }
                            else {
                                newDataJson = [{
                                    chatId: data.chatId,
                                    messageId: "",
                                }]
                            }
                            localStorage.setItem(JSON.parse(sessionStorage.getItem("infoLoggedUser")).email, JSON.stringify(newDataJson));

                            toast.info((data.senderUsername + " sent you a message"), {
                                position: "bottom-right",
                                autoClose: 5000,
                                hideProgressBar: false,
                                closeOnClick: true,
                                pauseOnHover: true,
                                draggable: false,
                                progress: undefined,
                            });
                            if (listChatsRef.current.length > 0) {
                                listChatsRef.current.forEach((chat) => {
                                    if (chat._id === data.chatId) {
                                        document.querySelector(`#toggle-${chat._id}`).classList.add("visible");
                                    }
                                })
                            }

                            if (audioNotificationsRef.current) {
                                if (navigator.userActivation.hasBeenActive) {
                                    audio.play();
                                }
                            }
                        }
                    }
                    else {
                        let dataJson = [];
                        let newDataJson = [];

                        if (localStorage.getItem(JSON.parse(sessionStorage.getItem("infoLoggedUser")).email)) {
                            dataJson = JSON.parse(localStorage.getItem(JSON.parse(sessionStorage.getItem("infoLoggedUser")).email));
                            newDataJson = dataJson;

                            let checkJson = false
                            dataJson.forEach((element, index) => {
                                if (element.chatId === data.chatId) {
                                    newDataJson[index].messageId = "";
                                    checkJson = true;
                                }
                            })
                            if (!checkJson) {
                                newDataJson.push(
                                    {
                                        chatId: data.chatId,
                                        messageId: "",
                                    }
                                )
                            }

                        }
                        else {
                            newDataJson = [{
                                chatId: data.chatId,
                                messageId: "",
                            }]
                        }
                        localStorage.setItem(JSON.parse(sessionStorage.getItem("infoLoggedUser")).email, JSON.stringify(newDataJson));

                        toast.info((data.senderUsername + " sent you a message"), {
                            position: "bottom-right",
                            autoClose: 5000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: false,
                            progress: undefined,
                        });

                        if (listChatsRef.current.length > 0) {
                            listChatsRef.current.forEach((chat) => {
                                if (chat._id === data.chatId) {
                                    document.querySelector(`#toggle-${chat._id}`).classList.add("visible");
                                }
                            })
                        }
                        if (audioNotificationsRef.current) {
                            if (navigator.userActivation.hasBeenActive) {
                                audio.play();
                            }
                        }
                    }
                    if (data.type === "IMAGE")
                        updateListChatsMessageByChatId(data.chatId, "sent an image", data.date, data.type, data.senderUser, data._id);
                    else if (data.type === "VIDEO")
                        updateListChatsMessageByChatId(data.chatId, "sent a video", data.date, data.type, data.senderUser, data._id);
                    else if (data.type === "AUDIO")
                        updateListChatsMessageByChatId(data.chatId, "sent an audio", data.date, data.type, data.senderUser, data._id);
                    else
                        updateListChatsMessageByChatId(data.chatId, data.message, data.date, data.type, data.senderUser, data._id);
                })
            }
        }
    }, [global.socket.current]);

    useEffect(() => {
        setListUserSearch([]);
        if (!document.querySelector("#imgGifSearch")) {
            const imgLoadingUser = document.createElement("img");
            imgLoadingUser.src = gif;
            imgLoadingUser.className = "imgLoading";
            imgLoadingUser.id = "imgGifSearch";
            document.querySelector(".list-users").appendChild(imgLoadingUser);
        }

        if (textSearch !== "") {
            fetch(`${API_BASE_URL}/tokenApi/manageUsers/findUser/` + textSearch, {
                method: "GET",
                headers: new Headers({
                    token: sessionStorage.getItem("token"),
                }),
            })
                .then((res) => {
                    if (res.status === 200) {
                        return res.json();
                    }
                })
                .then((obj) => {
                    if (document.querySelector("#imgGifSearch")) {
                        document.querySelector(".imgLoading").remove();
                    }
                    setListUserSearch(obj);
                })
        }
        else {
            if (document.querySelector("#imgGifSearch")) {
                document.querySelector(".imgLoading").remove();
            }
            setListUserSearch([]);
        }
    }, [textSearch]);

    function handleOpenChat(event, idUser2) {
        event.preventDefault();
        fetch(`${API_BASE_URL}/tokenApi/manageChats/createChat`, {
            method: "POST",
            headers: new Headers({
                token: sessionStorage.getItem("token"),
                "Content-Type": "application/json",
            }),
            body: JSON.stringify({
                userId1: JSON.parse(sessionStorage.getItem("infoLoggedUser"))._id,
                userId2: idUser2,
            })
        })
            .then(res => {
                if (res.status === 200) {
                    return res.json();
                }
            })
            .then(obj => {
                if (obj.message === "CREATE_CHAT_ERROR") {
                    toast.error('An error has occurred', {
                        position: "bottom-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                }
                else {
                    global.socket.current.emit("createChat", {
                        newChat: {
                            messages: [],
                            partecipants: [{
                                lastAccess: new Date(),
                                profilePictureURL: JSON.parse(sessionStorage.getItem("infoLoggedUser")).profilePictureURL,
                                username: JSON.parse(sessionStorage.getItem("infoLoggedUser")).username,
                                _id: JSON.parse(sessionStorage.getItem("infoLoggedUser"))._id
                            }],
                            _id: obj.chatId
                        },
                        recipientUser: idUser2
                    });

                    fetch(`${API_BASE_URL}/tokenApi/manageChats/getAllChats`, {
                        method: "GET",
                        headers: new Headers({
                            token: sessionStorage.getItem("token"),
                        }),
                    })
                        .then(res => {
                            if (res.status === 200) {
                                return res.json();
                            }
                        })
                        .then(obj => {
                            if (obj.message === "GET_ALL_CHATS_ERROR") {
                                toast.error('An error has occurred', {
                                    position: "bottom-right",
                                    autoClose: 5000,
                                    hideProgressBar: false,
                                    closeOnClick: true,
                                    pauseOnHover: true,
                                    draggable: true,
                                    progress: undefined,
                                });
                            }
                            else if (obj.message === "GET_ALL_CHATS_OK") {
                                if (document.querySelector(".imgLoadingList")) {
                                    document.querySelector(".imgLoadingList").remove();
                                }
                                setListChats(obj.chats);
                            }
                        })

                    fetch(`${API_BASE_URL}/tokenApi/manageChats/getAllChatMessages/` + obj.chatId, {
                        method: "GET",
                        headers: new Headers({
                            token: sessionStorage.getItem("token"),
                        }),
                    })
                        .then(res => {
                            if (res.status === 200) {
                                return res.json();
                            }
                        })
                        .then(chats => {
                            if (chats.message === "GET_ALL_CHAT_MESSAGES_ERROR") {
                                toast.error('An error has occurred', {
                                    position: "bottom-right",
                                    autoClose: 5000,
                                    hideProgressBar: false,
                                    closeOnClick: true,
                                    pauseOnHover: true,
                                    draggable: true,
                                    progress: undefined,
                                });
                            }
                            else if (chats.message === "GET_ALL_CHAT_MESSAGES_OK") {
                                setActiveChat(chats);
                            }
                        })
                }
            })
    }

    function handlePopupProfile(event) {
        event.preventDefault();
        setPopupProfile(!popupProfile);
    }

    function handlePopupMedia(event) {
        event.preventDefault();
        setPopupMedia(!popupMedia);
    }

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setSelectedFile(file);
    };

    function handleSubmitMedia(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const lastDotIndex = selectedFile.name.lastIndexOf('.');
        const fileExtension = selectedFile.name.substring(lastDotIndex + 1);
        handlePopupMedia(event);
        toast.info("Wait, it's loading...", {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
        });
        if (fileExtension === "jpg" || fileExtension === "jpeg" || fileExtension === "png") {
            fetch(`${API_BASE_URL}/tokenApi/file/uploadChatPicture/` + activeChat.chats[0]._id, {
                method: "POST",
                headers: new Headers({
                    token: sessionStorage.getItem("token"),
                }),
                body: formData
            })
                .then((res) => {
                    if (res.status === 200) {
                        return res.json();
                    }
                })
                .then((obj) => {
                    if (obj.message === "INSERT_MESSAGE_OK") {
                        const provissorioArr = [...newMessages];
                        provissorioArr.push(obj.messageDB);
                        setNewMessages(provissorioArr);

                        global.socket.current.emit("sendMessage", {
                            recipientUser: activeChat.chats[0].partecipants[0]._id,
                            message: obj.messageDB.message,
                            date: serverDateToItaly(obj.messageDB.date),
                            type: obj.messageDB.type,
                            _id: obj.messageDB._id,
                            chatId: obj.chatId
                        });

                        updateListChatsMessageByChatId(activeChatRef.current.chats[0]._id, "sent an image", obj.messageDB.date, obj.messageDB.type, JSON.parse(sessionStorage.getItem("infoLoggedUser"))._id, obj.messageDB._id);
                    }
                    else {
                        toast.error(('An error has occured'), {
                            position: "bottom-right",
                            autoClose: 5000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: false,
                            progress: undefined,
                        });
                    }
                })
        }
        else {
            fetch(`${API_BASE_URL}/tokenApi/file/uploadChatVideo/` + activeChat.chats[0]._id, {
                method: "POST",
                headers: new Headers({
                    token: sessionStorage.getItem("token"),
                }),
                body: formData
            })
                .then((res) => {
                    if (res.status === 200) {
                        return res.json();
                    }
                })
                .then((obj) => {
                    if (obj.message === "INSERT_MESSAGE_OK") {
                        const provissorioArr = [...newMessages];
                        provissorioArr.push(obj.messageDB);
                        setNewMessages(provissorioArr);
                        handlePopupMedia(event);

                        global.socket.current.emit("sendMessage", {
                            recipientUser: activeChat.chats[0].partecipants[0]._id,
                            message: obj.messageDB.message,
                            date: serverDateToItaly(obj.messageDB.date),
                            type: obj.messageDB.type,
                            _id: obj.messageDB._id,
                            chatId: obj.chatId
                        });

                        updateListChatsMessageByChatId(activeChatRef.current.chats[0]._id, "sent a video", obj.messageDB.date, obj.messageDB.type, JSON.parse(sessionStorage.getItem("infoLoggedUser"))._id, obj.messageDB._id);
                    }
                    else {
                        toast.error(('An error has occured'), {
                            position: "bottom-right",
                            autoClose: 5000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: false,
                            progress: undefined,
                        });
                    }
                })
        }
    }

    const addAudioElement = (blob) => {
        const formData = new FormData();
        const format = blob.type.split(";")[0].toLowerCase();
        const extensions = { "audio/webm": ".webm", "audio/ogg": ".ogg",
            "audio/mp4": ".m4a", "audio/mpeg": ".mp3", "audio/wav": ".wav",
            "audio/x-wav": ".wav" };
        const ext = extensions[format];
        if (!ext) {
            toast.error("Unsupported recording format");
            return;
        }
        formData.append("file", blob, `recording${ext}`);
        fetch(`${API_BASE_URL}/tokenApi/file/uploadChatAudio/` + activeChat.chats[0]._id, {
            method: "POST",
            headers: new Headers({
                token: sessionStorage.getItem("token"),
            }),
            body: formData
        })
            .then((res) => {
                if (res.status === 200) {
                    return res.json();
                }
            })
            .then((obj) => {
                if (obj.message === "INSERT_MESSAGE_OK") {
                    const provissorioArr = [...newMessages];
                    provissorioArr.push(obj.messageDB);
                    setNewMessages(provissorioArr);

                    global.socket.current.emit("sendMessage", {
                        recipientUser: activeChat.chats[0].partecipants[0]._id,
                        message: obj.messageDB.message,
                        date: serverDateToItaly(obj.messageDB.date),
                        type: obj.messageDB.type,
                        _id: obj.messageDB._id,
                        chatId: obj.chatId
                    });

                    updateListChatsMessageByChatId(activeChatRef.current.chats[0]._id, "sent an audio", obj.messageDB.date, obj.messageDB.type, JSON.parse(sessionStorage.getItem("infoLoggedUser"))._id, obj.messageDB._id);
                }
                else {
                    toast.error(('An error has occured'), {
                        position: "bottom-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: false,
                        progress: undefined,
                    });
                }
            })
    };

    function handleListChat(newList) {
        setListChats(newList)
    }

    return (
        <>
            {
                (popupProfile)
                    ? <PopupImage infoLoggedUser={infoLoggedUser} handleUpdateInfo={handleUpdateInfo} handleImage={handlePopupProfile} />
                    : null
            }

            {
                (popupMedia)
                    ? <PopupMedia handleFileChange={handleFileChange} handleSubmitMedia={handleSubmitMedia} chatActive={activeChat} handleImage={handlePopupMedia} />
                    : null
            }

            <Navbar handleLogout={handleLogout} handleColorTheme={props.handleColorTheme} handleChangeSearch={handleChangeSearch} />
            <section className="home">
                <OverSearch handleOpenChat={handleOpenChat} handleListChat={handleListChat} socket={global.socketUser} listUserSearch={listUserSearch} handleActiveChat={handleActiveChat} chatActive={activeChat} />
                <OverNotify handleListNotifications={handleListNotifications} listNotifications={listNotifications} handleListFilter={handleListFilter} />
                <OverProfile infoLoggedUser={infoLoggedUser} handleUpdateInfo={handleUpdateInfo} handleImage={handlePopupProfile} />
                <OverSettings audioNotifications={audioNotifications} handleAudioNotifications={handleAudioNotifications} />
                <ListMessages listChats={listChats} handle={handleActiveChat} />
                {
                    (Object.values(activeChat).every(value => value === undefined || value === null))
                        ? <EmptyChat />
                        : <ChatContainer showEmojiPicker={showEmojiPicker} handlePopupEmoji={handlePopupEmoji} addAudioElement={addAudioElement} messageText={messageText} handleMessageText={handleMessageText} newMessages={newMessages} handleImage={handlePopupMedia} chatActive={activeChat} insertText={handleSubmitTextMessage} />
                }
            </section>

        </>
    );
}

export default Homepage;