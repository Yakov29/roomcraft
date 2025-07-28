import React from "react";
import { Link } from "react-router-dom";
import "./ToHome.css"

const ToHome = () => {
    return (
        <Link to="/" className="tohome">На головну</Link>
    )
}

export default ToHome