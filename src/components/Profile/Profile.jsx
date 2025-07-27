import React, { useEffect, useState, useRef } from "react";
import Container from "../Container/Container";
import "./Profile.css";

const Profile = () => {
    const [user, setUser] = useState(null);
    const [editable, setEditable] = useState(false);
    const [formData, setFormData] = useState({});
    const fileInputRef = useRef(null);

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            setFormData(parsedUser);
        }
    }, []);

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    avatar: reader.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAvatarClick = () => {
        if (editable && fileInputRef.current) {
            fileInputRef.current.click();
        } else if (!editable && formData.avatar && formData.avatar.startsWith("data:image")) {
            const newWindow = window.open();
            if (newWindow) {
                newWindow.document.write(`<img src="${formData.avatar}" style="max-width: 100%; height: auto;" />`);
            }
        }
    };



    const handleEdit = () => {
        setEditable(true);
    };

    const handleApply = () => {
        setUser(formData);
        localStorage.setItem("user", JSON.stringify(formData));
        setEditable(false);
        window.location.reload();
    };


    const handleReset = () => {
        setFormData(user);
        setEditable(false);
    };
    const handleDelete = () => {
        if (window.confirm("Ви впевнені, що хочете видалити профіль?")) {
            localStorage.removeItem("user");
            setUser(null);
            window.location.href = "/";
        }
    };



    if (!user) return null;


    return (
        <section className="profile">
            <Container>
                <div className="profile__card">
                    <img
                        className={`profile__avatar ${editable ? "profile__avatar--editable" : ""}`}
                        src={formData.avatar}
                        alt="Аватар"
                        onClick={handleAvatarClick}
                        style={{ cursor: editable ? "pointer" : "default" }}
                    />
                    {editable && (
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            style={{ display: "none" }}
                            onChange={handleAvatarChange}
                        />
                    )}

                    <p className="profile__id">ID: {formData.id}</p>

                    <h2 className="profile__title">@{formData.username}</h2>

                    <ul className="profile__list">
                        <li className="profile__item">
                            <input
                                type="text"
                                name="name"
                                className="profile__input"
                                value={formData.name}
                                onChange={handleChange}
                                readOnly={!editable}
                            />
                        </li>
                        <li className="profile__item">
                            <input
                                type="text"
                                name="surname"
                                className="profile__input"
                                value={formData.surname}
                                onChange={handleChange}
                                readOnly={!editable}
                            />
                        </li>
                        <li className="profile__item">
                            <input
                                type="text"
                                name="username"
                                className="profile__input"
                                value={formData.username}
                                onChange={handleChange}
                                readOnly={!editable}
                            />
                        </li>
                        <li className="profile__item">
                            <input
                                type="text"
                                name="email"
                                className="profile__input"
                                value={formData.email}
                                onChange={handleChange}
                                readOnly={!editable}
                            />
                        </li>
                        <li className="profile__item">
                            <input
                                type="text"
                                name="password"
                                className="profile__input"
                                value={formData.password}
                                onChange={handleChange}
                                readOnly={!editable}
                            />
                        </li>
                    </ul>
                </div>

                {!editable && (
                    <button className="profile__change" onClick={handleEdit}>
                        Змінити
                    </button>
                )}

                {editable && (
                    <div className="profile__buttons">
                        <button className="profile__apply" onClick={handleApply}>
                            Застосувати
                        </button>
                        <button className="profile__reset" onClick={handleReset}>
                            Скинути
                        </button>
                    </div>
                )}

                <button className="profile__delete" onClick={handleDelete}>
                    Видалити
                </button>
            </Container>
        </section>
    );

};

export default Profile;
