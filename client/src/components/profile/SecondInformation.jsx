function SecondInformation(props) {
    return (
        <div className="second-information">
            <span className="username-user-profile">{props.username}</span>
            {props.email && <span className="mail-user-profile">{props.email}</span>}
        </div>
    );
}

export default SecondInformation;