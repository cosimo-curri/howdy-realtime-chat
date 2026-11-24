function ModifyItem(props) {
    return (
        <div className="infield">
            <input type="text" value={props.value} placeholder={props.placeholder} onChange={props.handle} className="modify-user" />
            <div className="label"></div>
        </div>
    );
}

export default ModifyItem;