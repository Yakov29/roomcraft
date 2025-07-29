import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

    const [isFormValid, setIsFormValid] = useState(false);

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

    const generateId = () => {
        return Math.floor(10000000 + Math.random() * 90000000).toString();
    };

    useEffect(() => {
        const requiredFields = ["name", "surname", "username", "email", "password", "repeat"];
        const allFilled = requiredFields.every(field => formData[field].trim() !== "");
        const passwordsMatch = formData.password === formData.repeat;
        setIsFormValid(allFilled && passwordsMatch);
    }, [formData]);

    const handleRegister = () => {
        if (!isFormValid) {
            alert("Будь ласка, заповніть усі обов'язкові поля та переконайтеся, що паролі співпадають.");
            return;
        }

        let finalAvatar = formData.avatar;
        if (!finalAvatar) {
            finalAvatar = "https://www.pphfoundation.ca/wp-content/uploads/2018/05/default-avatar.png";
        }

        const userProfile = {
            id: generateId(),
            name: formData.name,
            surname: formData.surname,
            username: formData.username,
            email: formData.email,
            password: formData.password,
            avatar: finalAvatar,
            rooms: []
        };

        localStorage.setItem("user", JSON.stringify(userProfile));
        navigate("/");
        document.location.reload();
    };

    return (
        <section className="register">
            <h2 className="register__title">Приєднуйся до RoomCraft та почни створювати свою кімнату мрії! 🤪</h2>
            <p className="register__description">Створи обліковий запис і отримай доступ до унікального конструктора кімнат...</p>
            <form autoComplete="off">
                <ul className="register__list">
                    <li className="register__item">
                        <p className="register__name">Ім'я <span className="required-star">*</span></p>
                        <input
                            type="text"
                            name="name"
                            className="register__input"
                            placeholder="Ваше ім'я"
                            onChange={handleChange}
                            required
                            autoComplete="off"
                        />
                    </li>
                    <li className="register__item">
                        <p className="register__name">Прізвище <span className="required-star">*</span></p>
                        <input
                            type="text"
                            name="surname"
                            className="register__input"
                            placeholder="Ваше прізвище"
                            onChange={handleChange}
                            required
                            autoComplete="off"
                        />
                    </li>
                    <li className="register__item">
                        <p className="register__name">Юзернейм <span className="required-star">*</span></p>
                        <input
                            type="text"
                            name="username"
                            className="register__input"
                            placeholder="Ваш унікальний юзернейм"
                            onChange={handleChange}
                            required
                            autoComplete="off"
                        />
                    </li>
                    <li className="register__item">
                        <p className="register__name">Email <span className="required-star">*</span></p>
                        <input
                            type="email"
                            name="email"
                            className="register__input"
                            placeholder="example@gmail.com"
                            onChange={handleChange}
                            required
                            autoComplete="off"
                        />
                    </li>
                    <li className="register__item">
                        <p className="register__name">Пароль <span className="required-star">*</span></p>
                        <input
                            type="password"
                            name="password"
                            className="register__input"
                            placeholder="Ваш пароль"
                            onChange={handleChange}
                            required
                            autoComplete="new-password"
                        />
                    </li>
                    <li className="register__item">
                        <p className="register__name">Повтор паролю <span className="required-star">*</span></p>
                        <input
                            type="password"
                            name="repeat"
                            className="register__input"
                            placeholder="Повторіть пароль"
                            onChange={handleChange}
                            required
                            autoComplete="new-password"
                        />
                    </li>
                    <li className="register__item">
                        <p className="register__name">Аватар</p>
                        <label className="avatar-upload">
                            <span className="avatar-upload__text">Завантажити аватар</span>
                            <input
                                type="file"
                                accept="image/*"
                                className="avatar-upload__input"
                                onChange={handleImageUpload}
                                autoComplete="off"
                            />
                        </label>
                        <img
                            src={formData.avatar || "https://www.pphfoundation.ca/wp-content/uploads/2018/05/default-avatar.png"}
                            alt="avatar preview"
                            className="avatar-preview"
                        />
                    </li>
                </ul>
                <p style={{ color: "#E1E6F0", marginTop: "30px", fontSize: "1rem" }}>
                    Усі поля, позначені *, обов'язкові для заповнення. Паролі повинні співпадати.
                </p>
                <button
                    type="button"
                    className={`register__button ${!isFormValid ? "register__button--disabled" : ""}`}
                    onClick={handleRegister}
                >
                    Зареєструватись
                </button>
            </form>
        </section>
    );
};

export default Register;
