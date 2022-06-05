import TreeMenu from "react-simple-tree-menu";
import {useEffect, useRef, useState} from "react";
import axios from "axios";
import {
    Accordion,
    Button,
    Card,
    Carousel,
    FormControl,
    InputGroup,
    ListGroup,
    Spinner,
} from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from "./App.module.css"
import "react-simple-tree-menu/dist/main.css";
import {toast, ToastContainer} from "react-toastify";
import 'react-toastify/dist/ReactToastify.css'

const chains = ['city district street', 'district country city home', 'country district street home', 'home' +
' country', 'street city home'];

function App() {
    const [types, setTypes] = useState([]);
    const [treeData, setTreeData] = useState(null);
    const chainRef = useRef();

    useEffect(() => {
        axios.get(`${process.env.REACT_APP_API_URL}/types`)
            .then(response => {
                if (response.status === 200) {
                    setTypes(Array.from(response.data, e => e.type))
                }
            })
    }, [])

    const contains = (where, what) => {
        for (let i = 0; i < what.length; i++) {
            if (where.indexOf(what[i]) === -1) return false;
        }
        return true;
    }

    const getTreeData = () => {
        let chain = chainRef.current.value;
        chain = chain.replace(/\s+/g, ' ').trim()
        chain = [...new Set(chain.split(' '))]
        if (contains(types, chain)) {
            axios.post(`${process.env.REACT_APP_API_URL}/hierarchy`, {
                hierarchyChain: chain,
            }).then(response => {
                if (response.status === 200) {
                    setTreeData(response.data)
                } else {
                    setTreeData(null)
                }
            })
        } else {
            toast.warn('Невалидная цепочка', {autoClose: 2000})
        }
    }

    const onItemClick = (item) => {
        if (!item.hasNodes) {
            toast.info(`${item.citizenName}, ${item.cityName}, ${item.cityData} жителей.`, {autoClose: 1500})
        }
    }

    return (
        <div className={styles.container}>
            <ToastContainer/>
            <div className={styles.container}>
                <Card>
                    <Card.Body>
                        <Card.Title>Динамическая иерархия граждан</Card.Title>
                    </Card.Body>
                </Card>
            </div>

            <div className={styles.container}>
                {types.length ? <>
                    <Accordion defaultActiveKey="0">
                        <Accordion.Item eventKey="0">
                            <Accordion.Header>Набор фильтров</Accordion.Header>
                            <Accordion.Body>
                                <Card>
                                    <Card.Body>
                                        <Card.Text>Я расширил базовые фильтры, добавив к ним coutry и home.
                                            Фильтры
                                            каждому человеку
                                            назначены случайным образом. Вы можете добиться первоначальной
                                            струтуры путем удаления этих фильтров из цепочки, то есть оставить
                                            только city, district и street.</Card.Text>
                                    </Card.Body>
                                </Card>
                                <br/>
                                <ListGroup as="ol" numbered>
                                    {types.map(type => {
                                        return (
                                            <ListGroup.Item key={type} as="li">{type}</ListGroup.Item>
                                        );
                                    })}
                                </ListGroup>
                            </Accordion.Body>
                        </Accordion.Item>
                    </Accordion>
                </> : <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>}
            </div>

            <div className={styles.container}>
                <Accordion defaultActiveKey="0">
                    <Accordion.Item eventKey="0">
                        <Accordion.Header>Что такое цепочка и как её строить?</Accordion.Header>
                        <Accordion.Body>
                            Цепочка состоит из последовательно идущих фильтров разделенных пробелом. Вы можете
                            строить абсолютно любые иерархии, например помимо банального примера город > район
                            > улица, можно составить следующую цепочку: улица > город или дом > город, такие
                            варианты могут быть полезными при анализе данных, то есть мы можем посмотреть кто
                            живет на одноименных улицах в разных городах и т.д. Ниже
                            представлены примеры возможных цепочек, но это только часть комбинаций, придумайте
                            свою прямо сейчас!
                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion>
            </div>

            <div className={styles.carouselContainer}>
                <Carousel variant={'dark'}>
                    {chains.map((chain, index) => {
                        return (
                            <Carousel.Item key={chain}>
                                <img
                                    className="d-block w-100"
                                    height={'125px'}
                                    src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAARIAAAC4CAMAAAAYGZMtAAAAA1BMVEX///+nxBvIAAAASElEQVR4nO3BgQAAAADDoPlT3+AEVQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB8A8WoAAHxScUAAAAAAElFTkSuQmCC"
                                    alt="Third slide"
                                />
                                <Carousel.Caption>
                                    <h2>#{index + 1} {chain}</h2>
                                </Carousel.Caption>
                            </Carousel.Item>
                        );
                    })}
                </Carousel>
            </div>

            <div className={styles.container}>
                <InputGroup className="mb-3">
                    <FormControl
                        ref={chainRef}
                        placeholder="Введите цепочку..."
                        aria-label="Введите цепочку..."
                        aria-describedby="basic-addon2"
                    />
                    <Button onClick={getTreeData} variant="outline-primary" id="button-addon2">
                        Построить иерархию
                    </Button>
                </InputGroup>
            </div>

            {treeData ?
                <div className={styles.container}>
                    <Card>
                        <Card.Body>
                            <Card.Text>
                                Для вывода подробной информации выберите жителя (вместо тултипа).
                            </Card.Text>
                        </Card.Body>
                    </Card>
                    <br/>
                    <TreeMenu data={treeData} hasSearch={false} onClickItem={onItemClick}/>
                </div> :
                <div className={styles.container}>
                    <Card>
                        <Card.Body>
                            <Card.Title>Здесь будет отображена Ваша иерархия</Card.Title>
                        </Card.Body>
                    </Card>
                </div>}
        </div>
    );
}

export default App;
