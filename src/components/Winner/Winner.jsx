import React from "react"
import Container from "../Container/Container"
import "./Winner.css"

const Winner = () => {
    return (
        <section className="winner">
            <Container>
                <h2 className="winner__title">2-е місце на GameOfTeens! 🥈</h2>
                <p className="winner__description">
                    Мій проєкт RoomCraft зайняв 2-е місце на GameOfTeens серед 12 учасників. Я працював над ним самостійно і це був хороший досвід показати свою роботу у змагальному середовищі. Хоча результат не перший, я задоволений, що зміг представити проєкт і отримати визнання від журі. Цей досвід надихає мене продовжувати розвивати і вдосконалювати продукт.
                </p>
            </Container>
        </section>
    )
}


export default Winner