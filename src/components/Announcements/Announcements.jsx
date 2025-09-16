import Container from "../Container/Container"
import "./Announcements.css"
import { useEffect } from "react"
import AOS from "aos"
import "aos/dist/aos.css"

const pluralize = (number, one, few, many) => {
    const n = Math.abs(number) % 100
    const n1 = n % 10
    if (n > 10 && n < 20) return many
    if (n1 > 1 && n1 < 5) return few
    if (n1 === 1) return one
    return many
}

const timeAgo = (dateString) => {
    const now = new Date()
    const published = new Date(dateString)
    const seconds = Math.floor((now - published) / 1000)

    const intervals = [
        { seconds: 31536000, labels: ["рік", "роки", "років"] },
        { seconds: 2592000, labels: ["місяць", "місяці", "місяців"] },
        { seconds: 86400, labels: ["день", "дні", "днів"] },
        { seconds: 3600, labels: ["годину", "години", "годин"] },
        { seconds: 60, labels: ["хвилину", "хвилини", "хвилин"] }
    ]

    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds)
        if (count >= 1) {
            return `${count} ${pluralize(count, ...interval.labels)} тому`
        }
    }
    return "щойно"
}

const Announcements = () => {
    useEffect(() => {
        AOS.init({ duration: 600, easing: "ease-in-out", once: true })
    }, [])

    const announcements = [
        {
            id: 1,
            title: "Оновлення редактора",
            description: "Покращений інвентар та нові функції",
            image: "/images/editor-update.jpg",
            color: "#f39c12",
            date: "2025-09-07T22:00:00"
        },
        {
            id: 2,
            title: "Приз приїхав!",
            description: "Обіцяна футболка приїхала з Києва (білий колір)",
            image: "",
            color: "#ffffff",
            date: "2025-09-10T12:00:00"
        },
        {
            id: 3,
            title: "2 місце на GameOfTeens 2025! 🥈",
            description: "Вітаємо з другим місцем на конкурсі GameOfTeens 2025",
            image: "/images/gameofteens.jpg",
            color: "#3498db",
            date: "2025-08-04T19:10:00"
        }
    ]

    return (
        <section className="announcements">
            <Container>
                <ul className="announcements__list">
                    {announcements.map(({ id, title, description, image, color, date }, index) => (
                        <li
                            key={id}
                            className="announcements__item"
                            style={{ borderLeft: `4px solid ${color}` }}
                            data-aos="fade-up"
                            data-aos-delay={index * 150}
                        >
                            <h3 className="announcements__title">{title}</h3>
                            {description && (
                                <p className="announcements__description">{description}</p>
                            )}
                            <span className="announcements__date">
                                Опубліковано {timeAgo(date)}
                            </span>
                        </li>
                    ))}
                </ul>
            </Container>
        </section>
    )
}

export default Announcements
