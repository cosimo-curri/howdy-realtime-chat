function ItemLink(props) {
    return (
        <li className="nav-link">
        <button className={props.classBtn} onClick={props.handle}>
            <i className={props.classIcon}>
                {
                    (props.classBtn === "notify-btn") 
                    ? <div className="toggle-notify"></div>
                    : null
                }
            </i>
            <span className="text nav-text">{props.text}</span>
        </button>
    </li>
    );
}

export default ItemLink;

