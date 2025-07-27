import React, { useEffect } from "react";
import RoomsList from "../../components/RoomsList/RoomsList";

const Rooms = () => {
    useEffect(() => {
        document.title = "RoomCraft | Кiмнати"
    })
    return (
        <main>
            <RoomsList />
        </main>
    )
}

export default Rooms