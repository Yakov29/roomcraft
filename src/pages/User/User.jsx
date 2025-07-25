import React, { useEffect } from "react";
import Profile from "../../components/Profile/Profile";

const User = () => {
    useEffect(() => {
        document.title = "RoomCraft | Профіль"
    })
    return (
        <main>
            <Profile/>
        </main>
    )
}

export default User