function ChangePasswordBtn(props) {
    return (
        <div className="changePasswordHome">
            <span>Change Password</span>
            <button className="btn-change-password" onClick={props.handleChangePassword}>Change</button>
        </div>
    );
}

export default ChangePasswordBtn;