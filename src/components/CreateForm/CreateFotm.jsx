import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Container from "../Container/Container";
import "./CreateForm.css";

const CreateForm = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || { rooms: [], id: Date.now() };

  const [roomName, setRoomName] = useState("");
  const [roomType, setRoomType] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!roomName) return;

    const newRoom = {
      id: Date.now(),
      name: roomName,
      type: roomType,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    const updatedUser = {
      ...user,
      rooms: [...(user.rooms || []), newRoom],
    };

    localStorage.setItem("user", JSON.stringify(updatedUser));

    navigate(`/user/${updatedUser.id}/rooms`);
  };

  return (
      <section className="createform">
        <Container>
          <h2 className="createform__title">Зробіть все на свій смак і насолоджуйтесь!</h2>
          <form className="createform__form" onSubmit={handleSubmit}>
            <ul className="createform__list">
              <li className="createform__item">
                <p className="createform__name">Назва кімнати</p>
                <input
                    className="createform__input"
                    type="text"
                    placeholder={`Введіть назву кімнати`}
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                />
              </li>
            </ul>
            <p className="createform__warn">
              Зверніть увагу: редактор працює на технології WebGL — переконайтеся, що ваш пристрій її підтримує.
            </p>
            <button type="submit" className="createform__submit">
              Створити кімнату
            </button>
          </form>
        </Container>
      </section>
  );
};

export default CreateForm;
