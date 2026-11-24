function ModifyImage(props) {
    return (
        <div className="modify-image">
            <div className="foto-status">
                <img src={props.infoLoggedUser.profilePictureURL} className="user-foto" alt="photo" />
                <button className="toggle-image" onClick={(event) => props.handleImage(event)}>
                    <i className='bx bxs-pencil'></i>
                </button>
            </div>
        </div>
    );
}

export default ModifyImage;