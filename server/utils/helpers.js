const User = require("../models/users");
const Friendship = require("../models/friendships/friendships");
const PendingRequest = require("../models/friendships/pendingRequests");
const Chat = require("../models/chats/chats");
const Story = require("../models/stories");

const moment = require("moment");

const schedule = require("node-schedule");
const scheduleJobs = require("../utils/scheduleJobs");

const fs = require("fs");

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// This module contains shared data operations and request-independent helpers. ///
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//USED IN tokenApi ROUTE BUT ALSO IN api ROUTE SO CAN'T USE req.user BEFORE THE TOKEN VALIDATION
exports.lastAccessUpdater = async (userId) => {
    const currentDate = moment();
    await User.findOneAndUpdate({ _id: userId }, { lastAccess: currentDate.toDate() });
};

exports.userFindOrCreate = async (firstName, lastName, email, profilePictureURL, signupMethod) => {
    // Reuse an existing account before generating a new unique username.
    const existing = await User.findOne({ email: String(email).toLowerCase() });
    if (existing) return existing;
    let username;
    let userCheckUsername;
    if(!firstName || !lastName) {

        firstName = "user";

        do {
            lastName = Math.floor(Math.random() * 9000000) + 1000000;

            username = `${firstName.toLowerCase()}.${lastName.toString().toLowerCase()}`;
            userCheckUsername = await User.findOne({ username: username });
        } while(userCheckUsername);
    } else {
        username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;

        let nUnique = 1;

        do {
            userCheckUsername = await User.findOne({ username: username });

            if(userCheckUsername) {
                username += nUnique;
                nUnique++;
            }
        } while(userCheckUsername);
    }
    
    //FINDING USER BASED ON E-MAIL FOR CHECKING IF IS LOCAL-SUBSCRIBED
    let user = await User.findOne({ email: String(email).toLowerCase() });

    if(!user) {
        const currentDate = moment();

        user = await User.create({
            firstName: firstName,
            lastName: lastName,
            username: username,
            email: String(email).toLowerCase(),
            lastAccess: currentDate.toDate(),
            profilePictureURL: profilePictureURL,
            signupMethod: signupMethod //{ google: true }, etc.
        })
    }

    return user;
};

exports.clientFilterUser = (user) => {
    return {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        lastAccess: user.lastAccess,
        profilePictureURL: user.profilePictureURL,
        gender: user.gender,
        birthday: user.birthday,
        nationality: user.nationality,
        contacts: user.contacts,
        darkTheme: user.darkTheme,
        signupMethod: user.signupMethod
    };
};

// Limited representation for profiles, contacts and public search results.
// The account owner continues to receive the full clientFilterUser representation.
exports.publicFilterUser = user => ({
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    lastAccess: user.lastAccess,
    profilePictureURL: user.profilePictureURL,
    gender: user.gender,
    birthday: user.birthday,
    contacts: user.contacts
});

exports.changeCurrentToken = async (userId, token) => {
    await User.findOneAndUpdate({ _id: userId }, { currentValidToken: token });
};

exports.invalidToken = async (userId) => {
    await User.findOneAndUpdate({ _id: userId }, { currentValidToken: null });
};

exports.googleAuthCallback = (dataJSON, reactAppDomain) => {
    const safePayload = JSON.stringify(dataJSON).replace(/</g, "\\u003c").replace(/>/g, "\\u003e");
    const safeOrigin = JSON.stringify(new URL(reactAppDomain).origin);
    const html = `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <title>howdy?</title>

                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <meta name="description" content="howdy?">
                <meta name="application-name" content="howdy?">

                <link rel="stylesheet" href="./css/style.css" type="text/css">
                <link rel="stylesheet" href="./css/googleAuthCallback.css" type="text/css">
                <link rel="icon" href="./images/logo.png" type="image/png">
            </head>

            <body>
                <header id="header-loading">
                    <img src="./images/logo_auth_loading.png">
                    <img src="./images/loading.gif">
                </header>

                <script>
                    if(window.opener) {
                        window.opener.postMessage(${safePayload}, ${safeOrigin});
                    }

                    //THE USER SHOULD HAVE THE FEELING OF HAVING COMPLETED THE OPERATIONS WITH THE POPUP
                    window.onload = () => {
                        setTimeout(() => {
                            window.close();
                        }, 1000);
                    }
                </script>
            </body>
        </html>
    `;

    return html;
};

exports.safeFileStem = value => String(value).replace(/[^a-zA-Z0-9_-]/g, "_");

// Only files created for locally stored profile pictures can be removed.
// Do not attempt to unlink default avatars, Google-hosted images or external URLs.
exports.managedProfilePictureFilename = (pictureUrl, baseUrl) => {
    if (typeof pictureUrl !== "string" || typeof baseUrl !== "string" || !baseUrl) return null;
    try {
        const picture = new URL(pictureUrl);
        const base = new URL(baseUrl);
        if (picture.origin !== base.origin || picture.search || picture.hash) return null;
        const prefix = `${base.pathname.replace(/\/$/, "")}/profilePictures/`;
        if (!picture.pathname.startsWith(prefix)) return null;
        const filename = picture.pathname.slice(prefix.length);
        // Current random-suffixed filenames and the earlier username.png format.
        return /^(?:[A-Za-z0-9_-]+-[0-9a-f]{16}\.(?:png|jpe?g|webp)|[A-Za-z0-9_-]+\.png)$/.test(filename)
            ? filename : null;
    } catch (_) {
        return null;
    }
};

exports.isValidImageFile = (file, ext) => {
    if (!file || !Buffer.isBuffer(file.data)) return false;
    const data = file.data;
    if (ext === ".png") return data.length >= 8 &&
        data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    if (ext === ".jpeg" || ext === ".jpg") return data.length >= 3 &&
        data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
    if (ext === ".webp") return data.length >= 12 &&
        data.toString("ascii", 0, 4) === "RIFF" && data.toString("ascii", 8, 12) === "WEBP";
    return false;
};

// Basic media-container signature validation. This does not replace malware
// scanning, transcoding or sandboxed decoding for an Internet-facing service.
exports.isValidMediaFile = (file, ext) => {
    if (!file || !Buffer.isBuffer(file.data)) return false;
    const bytes = file.data;
    const header = value => bytes.length >= value.length && bytes.subarray(0, value.length).equals(value);
    const ascii = (start, length) => bytes.toString("ascii", start, start + length);
    if ([".png", ".jpg", ".jpeg", ".webp"].includes(ext)) {
        return exports.isValidImageFile(file, ext);
    }
    if (ext === ".mp3") return header(Buffer.from("ID3")) ||
        (bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
    if (ext === ".wav") return bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 4) === "WAVE";
    if (ext === ".ogg") return ascii(0, 4) === "OggS";
    if (ext === ".mp4" || ext === ".m4a") return bytes.length >= 12 && ascii(4, 4) === "ftyp";
    if (ext === ".webm" || ext === ".mkv") return bytes.length >= 4 &&
        header(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
    if (ext === ".avi") return bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 4) === "AVI ";
    if (ext === ".wmv") return header(Buffer.from("3026b2758e66cf11a6d900aa0062ce6c", "hex"));
    return false;
};

exports.isExtAllowed = (ext, allowedExt) => {
    if(allowedExt.includes(ext))
        return true;

    return false;
};

exports.fileUpload = async (path, file) => {
    try {
        await file.mv(path);
        return { message: "UPLOAD_OK" };
    } catch(error) {
        return { message: "UPLOAD_ERROR" };
    }
};

exports.mkdir = async (directoryPath) => {
    try {
        await fs.promises.mkdir(directoryPath, { recursive: true });
        return { message: "CREATING_DIRECTORY_OK" };
    } catch (_) {
        return { message: "CREATING_DIRECTORY_ERROR" };
    }
};

//ID OF THE PENDING FRIEND REQUEST ONLY IF THE SENDER IS THE LOGGED USER
exports.isAlreadyFriendOrRequest = async (loggedUserId, otherUserId) => {
    let result = {};

    try {
        const friendship = await Friendship.findOne({
            $or: [
                {
                    user1: loggedUserId,
                    user2: otherUserId
                },
                {
                    user1: otherUserId,
                    user2: loggedUserId
                }
            ]
        });

        if(friendship)
            result = { message: "ALREADY_FRIEND" };
        else {
            await PendingRequest.findOne({
                $or: [
                    {
                        senderUser: loggedUserId,
                        recipientUser: otherUserId
                    },
                    {
                        senderUser: otherUserId,
                        recipientUser: loggedUserId
                    }
                ]
            })
            .then(pr => {
                if(pr) {
                    if(pr.senderUser.equals(loggedUserId)) {
                        result = {
                            message: "ALREADY_REQUEST_SENT",
                            pendingRequestId: pr._id
                        }
                    } else {
                        result = {
                            message: "ALREADY_REQUEST_RECEIVED",
                            pendingRequestId: pr._id
                        }
                    }
                } else
                    result = { message: "FALSE" };
            })
            .catch(() => result = { message: "ERROR" });
        }
    } catch(error) {
        result = { message: "ERROR" };
    }

    return result;
};

exports.clientFilterChats = (chats, userId, option) => {
    return chats.map((chat) => {
        const chatOBJ = chat.toObject();

        if(option === "ONLY_ONE") {
            const temp = chatOBJ.messages[0];
            delete chatOBJ.messages;
            chatOBJ.messages = [temp];
        }
        
        const clientFilterPartecipants = chatOBJ.partecipants.filter((element) => {
            if(!element._id.equals(userId))
                return element;
        });
        
        chatOBJ.partecipants = clientFilterPartecipants;
        
        return chatOBJ;
    });
};

exports.isChatAllowed = async (chatId, userId) => {
    try {
        const chat = await Chat.findOne(
            {
                _id: chatId,
                partecipants: {
                    $in: [userId]
                }
            }
        );

        if(chat)
            return { message: "YES" };
        else
            return { message: "NO" };
    } catch(error) {
        return { message: "ERROR" };
    }
};

exports.applyDefaultProfilePicture = (req) => {
    if(req.user.gender) {
        req.user.gender === "F" ?
        req.user.profilePictureURL = `${process.env.BASE_URL}/default/user_female.png` :
        req.user.profilePictureURL = `${process.env.BASE_URL}/default/user_male.png`;
    } else
        req.user.profilePictureURL = `${process.env.BASE_URL}/default/user_male.png`;
};

exports.isHexColor = (hex) => {
    const reg = /^#([0-9a-f]{3}){1,2}$/i;
    return reg.test(hex);
};

//IF I SCHEDULE A JOB WITH A PAST DATE node-schedule RUN IT IMMEDIATELY
exports.re_schedule = () => {
    Story.find()
        .then(stories => {
            ///////////////////////
            /// SCHEDULING JOBS ///
            ///////////////////////

            stories.forEach(async (story) => {
                try {
                    const user = await User.findOne({ stories: story._id });

                    const currentDate = moment();
                    let expireDate = moment(new Date(story.expireDate));

                    if(currentDate.isAfter(expireDate))
                        expireDate = currentDate.add(5, "seconds");

                    schedule.scheduleJob(expireDate.toDate(), () => {
                        scheduleJobs.deleteStory(user, story, expireDate);
                    });
                } catch(error) {
                    console.log("SERVER (STORIES MANAGEMENT): re-schedule error")
                }
            });
        })
        .catch(() => console.log("SERVER (STORIES MANAGEMENT): re-schedule error"));
};