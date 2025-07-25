import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Container from "../Container/Container";
import "./Register.css";

const Register = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        surname: "",
        username: "",
        email: "",
        password: "",
        repeat: "",
        avatar: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData((prev) => ({ ...prev, avatar: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRegister = () => {
        if (formData.password !== formData.repeat) {
            alert("Паролі не співпадають");
            return;
        }

        const userProfile = {
            name: formData.name,
            surname: formData.surname,
            username: formData.username,
            email: formData.email,
            password: formData.password,
            avatar: formData.avatar,
            rooms: []
        };

        localStorage.setItem("user", JSON.stringify(userProfile));
        navigate("/");
        document.location.reload()
    };

    return (
        <section className="register">
            <h2 className="register__title">Приєднуйся до RoomCraft та почни створювати свою кімнату мрії! 🤪</h2>
            <p className="register__description">Створи обліковий запис і отримай доступ до унікального конструктора кімнат...</p>
            <ul className="register__list">
                <li className="register__item">
                    <p className="register__name">Ім'я</p>
                    <input type="text" name="name" className="register__input" placeholder="Віктор" onChange={handleChange} />
                </li>
                <li className="register__item">
                    <p className="register__name">Прізвище</p>
                    <input type="text" name="surname" className="register__input" placeholder="Цой" onChange={handleChange} />
                </li>
                <li className="register__item">
                    <p className="register__name">Юзернейм</p>
                    <input type="text" name="username" className="register__input" placeholder="viktortsoi2106" onChange={handleChange} />
                </li>
                <li className="register__item">
                    <p className="register__name">Email</p>
                    <input type="email" name="email" className="register__input" placeholder="viktortsoi@gmail.com" onChange={handleChange} />
                </li>
                <li className="register__item">
                    <p className="register__name">Пароль</p>
                    <input type="password" name="password" className="register__input" placeholder="********" onChange={handleChange} />
                </li>
                <li className="register__item">
                    <p className="register__name">Повтор паролю</p>
                    <input type="password" name="repeat" className="register__input" placeholder="********" onChange={handleChange} />
                </li>
                <li className="register__item">
                    <p className="register__name">Аватар</p>
                    <label className="avatar-upload">
                        <span className="avatar-upload__text">Завантажити аватар</span>
                        <input type="file" accept="image/*" className="avatar-upload__input" onChange={handleImageUpload} />
                    </label>
                    {formData.avatar && (
                        <img
                            src={formData.avatar}
                            alt="avatar preview"
                            className="avatar-preview"
                        />
                    )}
                </li>

            </ul>
            <button className="register__button" onClick={handleRegister}>
                Зареєструватись
            </button>
        </section>
    );
};

export default Register;
