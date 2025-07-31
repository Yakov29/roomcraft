import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./RoomsList.css"

const Container = ({ children }) => <div className="container mx-auto px-4">{children}</div>;

const AOS = {
  init: () => console.log("AOS initialized (placeholder)"),
};

const RoomsList = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);

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
    const handleResize = () => {
      setIsMobileOrTablet(window.innerWidth <= 1024);
    };
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
    const filename = `${room.name.replace(/\s/g, '_')}_room.rmc`;
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
          if (!uploadedRoom.createdAt) {
            uploadedRoom.createdAt = new Date().toISOString().split('T')[0];
          }

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
                        className="rooms__item bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col justify-between"
                        data-aos="fade-up"
                        data-aos-delay={index * 100}
                    >
                      <div className="cursor-pointer mb-4">
                        <h4 className="rooms__name text-2xl font-semibold text-gray-900 mb-2">{room.name}</h4>
                        <p className="rooms__date text-sm text-gray-500">Створено: {room.createdAt}</p>
                      </div>
                      <div className="rooms__buttons flex flex-wrap gap-3 mt-auto">
                        {!isMobileOrTablet && (
                            <button
                                className="rooms__action-button rooms__action-button--edit bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full shadow-md transition-colors duration-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(room.id);
                                }}
                            >
                              Редагувати
                            </button>
                        )}
                        <button
                            className="rooms__action-button rooms__action-button--delete bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full shadow-md transition-colors duration-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(room.id);
                            }}
                        >
                          Видалити
                        </button>
                        <button
                            className="rooms__action-button rooms__action-button--download bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full shadow-md transition-colors duration-200"
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
          <div className="rooms__actions flex flex-col sm:flex-row justify-center gap-4 mt-12" data-aos="fade-up" data-aos-delay={rooms.length * 100}>
            <button
                className="rooms__button bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-colors duration-200"
                onClick={() => navigate("/create")}
            >
              Створити нову
            </button>
            <label htmlFor="upload-room-file" className="rooms__button rooms__button--upload bg-yellow-500 hover:bg-yellow-600 text-gray-800 font-bold py-3 px-6 rounded-full shadow-lg transition-colors duration-200 cursor-pointer text-center">
              Імпортувати кімнату (.rmc / .json)
              <input
                  id="upload-room-file"
                  type="file"
                  accept=".rmc, .json"
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
