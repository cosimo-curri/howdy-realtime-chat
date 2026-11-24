import logo from "../../imgs/logo.png";

function EmptyChat() {
    return (
        <div className="chat-container">
            <div className="empty-container">
                <div className="img-container">
                    <img src={logo} alt="logo" />
                </div>
                <h1>Welcome to howdy?</h1>
                <p>the social chat app that makes connecting and communicating with friends, family and new people fun and easy</p>
            </div>
        </div>
    );
}

export default EmptyChat;