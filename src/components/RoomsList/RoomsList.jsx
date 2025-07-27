import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Container from "../Container/Container";
import "./RoomsList.css";

const RoomsList = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      const parsedUser = JSON.parse(user);
      setUserData(parsedUser);
      setRooms(parsedUser.rooms || []);
    }
  }, []);

  const handleDelete = (id) => {
    if (!userData) return;
    const updatedRooms = rooms.filter((room) => room.id !== id);
    const updatedUser = { ...userData, rooms: updatedRooms };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setRooms(updatedRooms);
    setUserData(updatedUser);
    window.location.reload();
  };

  const handleClick = (id) => {
    navigate(`/edit/${id}`);
  };

  const handleDownload = (room) => {
    const filename = `${room.name.replace(/\s/g, '_')}_room.json`;
    const jsonStr = JSON.stringify(room, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const uploadedRoom = JSON.parse(e.target.result);
        if (uploadedRoom && uploadedRoom.id && uploadedRoom.name) {
          const isDuplicate = rooms.some(room => room.id === uploadedRoom.id);
          if (isDuplicate) {
            alert("Кімната з таким ID вже існує. Завантажте інший файл або змініть ID.");
            return;
          }
          const updatedRooms = [...rooms, uploadedRoom];
          const updatedUser = { ...userData, rooms: updatedRooms };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setRooms(updatedRooms);
          setUserData(updatedUser);
        } else {
          alert("Невірний формат файлу кімнати. Переконайтеся, що файл містить коректні дані кімнати (id, name).");
        }
      } catch (error) {
        console.error("Error parsing uploaded file:", error);
        alert("Помилка при читанні файлу. Переконайтеся, що це коректний JSON файл.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <section className="rooms-list">
      <Container>
        <h2 className="rooms__title">Кімнати користувача</h2>
        {rooms.length === 0 ? (
          <p className="rooms__none">У вас ще немає кімнат. Створіть нову!</p>
        ) : (
          <ul className="rooms__list">
            {rooms.map((room) => (
              <li key={room.id} className="rooms__item">
                <div onClick={() => handleClick(room.id)} style={{ cursor: "pointer" }}>
                  <h4 className="rooms__name">{room.name}</h4>
                  <p className="rooms__date">Створено: {room.createdAt}</p>
                </div>
                <button
                  className="rooms__action-button rooms__action-button--download"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(room);
                  }}
                >
                  Експортувати
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="rooms__actions">
          <button className="rooms__button" onClick={() => navigate("/create")}>
            Створити нову
          </button>
          <label htmlFor="upload-room-file" className="rooms__button rooms__button--upload">
            Імпортувати кімнату
            <input
              id="upload-room-file"
              type="file"
              accept=".json"
              onChange={handleUpload}
              style={{ display: "none" }}
            />
          </label>
        </div>
      </Container>
    </section>
  );
};

export default RoomsList;
