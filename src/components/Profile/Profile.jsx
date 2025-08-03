import React, { useEffect, useState, useRef } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Container from "../Container/Container";
import "./Profile.css";
import AOS from "aos";
import "aos/dist/aos.css";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [editable, setEditable] = useState(false);
  const [formData, setFormData] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    AOS.init({
      duration: 700,
      easing: "ease-in-out",
      once: true,
    });

    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setFormData(parsedUser);
    }
  }, []);

  useEffect(() => {
    AOS.refresh();
  }, [editable]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          avatar: reader.result,
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
    // Валидация пароля
    const password = formData.password;
    if (password.length < 6) {
      setMessage("Пароль повинен бути мінімум 6 символів.");
      return;
    }
    const isPasswordEnglish = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/.test(password);
    if (!isPasswordEnglish) {
      setMessage("Пароль повинен містити тільки англійські символи.");
      return;
    }

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
    const isConfirmed = window.confirm("Ви впевнені, що хочете видалити профіль?");
    if (isConfirmed) {
      localStorage.removeItem("user");
      setUser(null);
      window.location.href = "/";
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (!user) return null;

  return (
      <section className="profile" data-aos="fade-up">
        {message && (
                <div className="message-box">
                    <p>{message}</p>
                    <button className="message-box__close" onClick={() => setMessage(null)}>
                        &times;
                    </button>
                </div>
            )}
        <Container>
          <div className="profile__card" data-aos="zoom-in" data-aos-delay="100">
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

            <p className="profile__id" data-aos="fade-right" data-aos-delay="200">ID: {formData.id}</p>
            <h2 className="profile__title" data-aos="fade-left" data-aos-delay="250">@{formData.username}</h2>

            {/* Блок с полями для редактирования, отображается только в режиме редактирования */}
            {editable && (
              <div className="profile__inputs" data-aos="fade-up" data-aos-delay="300">
                <input
                    type="text"
                    name="name"
                    className="profile__input"
                    value={formData.name}
                    onChange={handleChange}
                    readOnly={!editable}
                    placeholder="Ім'я"
                />
                <input
                    type="text"
                    name="surname"
                    className="profile__input"
                    value={formData.surname}
                    onChange={handleChange}
                    readOnly={!editable}
                    placeholder="Прізвище"
                />
                <input
                    type="text"
                    name="username"
                    className="profile__input"
                    value={formData.username}
                    onChange={handleChange}
                    readOnly={!editable}
                    placeholder="Нікнейм"
                />
                <input
                    type="text"
                    name="email"
                    className="profile__input"
                    value={formData.email}
                    onChange={handleChange}
                    readOnly={!editable}
                    placeholder="Email"
                />
                <div className="password-wrapper">
                  <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      className="profile__input"
                      value={formData.password}
                      onChange={handleChange}
                      readOnly={!editable}
                      placeholder="Пароль"
                  />
                  <button
                      type="button"
                      className="password-toggle"
                      onClick={togglePasswordVisibility}
                  >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="profile__buttons">
            {!editable ? (
                <>
                  <button className="profile__change" onClick={handleEdit}>Змінити</button>
                  <button className="profile__delete" onClick={handleDelete}>Видалити</button>
                </>
            ) : (
                <>
                  <button className="profile__apply" onClick={handleApply}>Застосувати</button>
                  <button className="profile__reset" onClick={handleReset}>Скинути</button>
                </>
            )}
          </div>
        </Container>
      </section>
  );
};

export default Profile;
