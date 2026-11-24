function PopupMedia(props) {
    return (
        <div className="all-popup-container">
            <i onClick={props.handleImage} className="fa-regular fa-circle-xmark closeBtn"></i>
            <div className="pop-container">
                <p className="titleImageDownload">Sent media file</p>
                <form action="#" id="formImgProfile" onSubmit={(event) => props.handleSubmitMedia(event)}>
                    <input onChange={props.handleFileChange} id="inputFile" name="file" type="file" accept=".jpeg, .jpg, .png, .mp4, .wmv, .avi, .mkv, .webm" />
                    <button className="button">Send</button>
                </form>
            </div>
        </div>
    );
}

export default PopupMedia;