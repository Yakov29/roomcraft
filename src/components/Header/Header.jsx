import React from "react";
import "./Header.css"
import Container from "../Container/Container";
import { Link } from "react-router-dom";

import { FaGithub } from "react-icons/fa";


const Header = () => {
    return (
        <header className="header">
            <Container>
                <Link to="/"><span className="header__home"><FaGithub/></span></Link>
                <ul className="header__list">
                    <li className="header__item">
                        <Link to="/" className="header__link">Домашня</Link>
                    </li>
                      <li className="header__item">
                        <Link to="/" className="header__link">Про проєкт</Link>
                    </li>
                      <li className="header__item">
                        <Link to="/" className="header__link">Контакти</Link>
                    </li>
                </ul>
                <button className="header__start">Зареєструватися</button>
            </Container>
        </header>
    )
}

export default Header