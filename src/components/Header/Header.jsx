import React, { useEffect, useState } from "react";
import "./Header.css";
import Container from "../Container/Container";
import { Link } from "react-router-dom";

const Header = () => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (storedUser) {
            setUser(storedUser);
        }
    }, []);

    return (
        <header className="header">
            <Container>
                <Link to="/">
                    <img className="header__home" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSVsJra7Rdc4ehn39o2sQW1hA9BP51afG1uVA&s" alt="Логотип" />
                </Link>
                <ul className="header__list">
                    <li className="header__item">
                        <Link to="/" className="header__link">Головна</Link>
                    </li>
                    <li className="header__item">
                        <Link to="/" className="header__link">Про проєкт</Link>
                    </li>
                    <li className="header__item">
                        <Link to="/" className="header__link">Контакти</Link>
                    </li>
                </ul>

                {user ? (
                    <Link to="/profile">
                        <img
                            src={user.avatar}
                            alt="Аватар"
                            className="header__avatar"
                        />
                    </Link>
                ) : (
                    <Link to="/get-started" className="header__start">Зареєструватися</Link>
                )}
            </Container>
        </header>
    );
};

export default Header;
