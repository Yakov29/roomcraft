import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./RoomsList.css";

const Container = ({ children }) => <div className="container mx-auto px-4">{children}</div>;

const AOS = {
  init: () => console.log("AOS initialized (placeholder)"),
};

const RoomsList = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [newRoomName, setNewRoomName] = useState("");

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      const parsedUser = JSON.parse(user);
      setUserData(parsedUser);
      setRooms(parsedUser.rooms || []);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobileOrTablet(window.innerWidth <= 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleDelete = (id) => {
    if (!userData) return;
    if (!window.confirm("Ви дійсно хочете видалити цю кімнату?")) return;

    const updatedRooms = rooms.filter((room) => room.id !== id);
    const updatedUser = { ...userData, rooms: updatedRooms };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setRooms(updatedRooms);
    setUserData(updatedUser);
  };

  const handleEdit = (id) => {
    navigate(`/edit/${id}`);
  };

  const handleDownload = (room) => {
    const filename = `${room.name.replace(/\s/g, "_")}_room.rmc`;
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
        let uploadedRoom = JSON.parse(e.target.result);

        if (uploadedRoom && uploadedRoom.id && uploadedRoom.name) {
          if (!uploadedRoom.createdAt) uploadedRoom.createdAt = new Date().toISOString().split('T')[0];

          const isDuplicate = rooms.some(room => room.id === uploadedRoom.id);
          if (isDuplicate) {
            alert("Кімната з таким ID вже існує. Завантажте інший файл (.rmc або .json) або змініть ID.");
            return;
          }
          const updatedRooms = [...rooms, uploadedRoom];
          const updatedUser = { ...userData, rooms: updatedRooms };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setRooms(updatedRooms);
          setUserData(updatedUser);
        } else {
          alert("Невірний формат файлу кімнати. Переконайтеся, що файл (.rmc або .json) містить коректні дані кімнати (id, name).");
        }
      } catch (error) {
        console.error("Error parsing uploaded file:", error);
        alert("Помилка при читанні файлу. Переконайтеся, що це коректний файл (.rmc або .json).");
      }
    };
    reader.readAsText(file);
  };

  const openRenameModal = (room) => {
    setEditingRoom(room);
    setNewRoomName(room.name);
    setIsModalOpen(true);
  };

  const handleSaveName = () => {
    if (!newRoomName.trim()) return;
    const updatedRooms = rooms.map((room) =>
      room.id === editingRoom.id ? { ...room, name: newRoomName } : room
    );
    const updatedUser = { ...userData, rooms: updatedRooms };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setRooms(updatedRooms);
    setUserData(updatedUser);
    setIsModalOpen(false);
    setEditingRoom(null);
    setNewRoomName("");
    document.location.reload()
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRoom(null);
    setNewRoomName("");
  };

  return (
    <section className="rooms-list bg-gray-100 py-12 min-h-screen">
      <Container>
        <h2 className="rooms__title text-4xl font-extrabold text-center text-gray-800 mb-10" data-aos="fade-down">
          Кімнати користувача
        </h2>

        {rooms.length === 0 ? (
          <p className="rooms__none text-xl text-center text-gray-600" data-aos="fade-up">
            У вас ще немає кімнат. Створіть нову!
          </p>
        ) : (
          <ul className="rooms__list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room, index) => (
              <li
                key={room.id}
                className="rooms__item"
                data-aos="fade-up"
                data-aos-delay={index * 100}
              >
                <div className="cursor-pointer mb-4">
                  <h4 className="rooms__name">{room.name}</h4>
                  <p className="rooms__date">Створено: {room.createdAt}</p>
                </div>
                <div className="rooms__buttons">
                  {!isMobileOrTablet && (
                    <button
                      className="rooms__action-button rooms__action-button--edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(room.id);
                      }}
                    >
                      Редагувати
                    </button>
                  )}
                  <button
                    className="rooms__action-button rooms__action-button--rename"
                    onClick={(e) => {
                      e.stopPropagation();
                      openRenameModal(room);
                    }}
                  >
                    Переименувати 
                  </button>
                  <button
                    className="rooms__action-button rooms__action-button--delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(room.id);
                    }}
                  >
                    Видалити
                  </button>
                  <button
                    className="rooms__action-button rooms__action-button--download"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(room);
                    }}
                  >
                    Експортувати (.rmc)
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="rooms__actions" data-aos="fade-up" data-aos-delay={rooms.length * 100}>
          <button
            className="rooms__button"
            onClick={() => navigate("/create")}
          >
            Створити нову
          </button>
          <label className="rooms__button rooms__button--upload">
            Імпортувати кімнату (.rmc / .json)
            <input
              type="file"
              accept=".rmc, .json"
              onChange={handleUpload}
            />
          </label>
        </div>
      </Container>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal__title">Переименувати кімнату</h3>
            <input
              className="modal__input"
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
            />
            <div className="modal__buttons">
              <button className="modal__button modal__button--cancel" onClick={closeModal}>
                Відмінити
              </button>
              <button className="modal__button modal__button--save" onClick={handleSaveName}>
                Переименовать
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default RoomsList;
