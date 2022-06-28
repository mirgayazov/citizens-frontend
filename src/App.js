import TreeMenu from "react-simple-tree-menu";
import {useEffect, useRef, useState} from "react";
import axios from "axios";
import {
    Accordion,
    Button,
    Card,
    Form,
    Carousel,
    FormControl,
    InputGroup,
    ListGroup,
    Spinner,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import styles from "./App.module.css"
import "react-simple-tree-menu/dist/main.css";
import {toast, ToastContainer} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import readXlsxFile from "read-excel-file";
import JSONViewer from 'react-json-viewer';

const chains = ["city district street", "district country city home", "country district street home", "home" +
" country", "street city home"];

function App() {
    const [types, setTypes] = useState([]);
    const [context, setContext] = useState(null);
    const [treeData, setTreeData] = useState(null);
    const [currentItem, setCurrentItem] = useState({});
    const chainRef = useRef();
    const userDatasetRef = useRef();

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
        chain = chain.replace(/\s+/g, " ").trim()
        let keySeparatorIndex = chain.indexOf('/');
        let keys = ['id'];
        if (keySeparatorIndex !== -1) {
            let newKeys = chain.substring(keySeparatorIndex + 1).trim()
            keys = keys.concat(newKeys.split(' ').map(e => e.replaceAll('_', ' ')))
            chain = chain.substring(0, keySeparatorIndex).trim()
        }
        chain = [...new Set(chain.split(" "))]
        console.log(types, chain)
        if (contains(types, chain)) {
            toast.info('Ожидайте. Данные обрабатываются', {autoClose: 1500})
            axios.post(`${process.env.REACT_APP_API_URL}/hierarchy`, {
                hierarchyChain: chain.map(e => e.replaceAll('_', ' ')),
                context, keys
            }).then(response => {
                toast.success('Готово', {autoClose: 1500})
                if (response.status === 200) {
                    setTreeData(response.data)
                } else {
                    setTreeData(null)
                }
            })
        } else {
            toast.warn("Невалидная цепочка", {autoClose: 2000})
        }
    }

    const onItemClick = (item) => {
        if (!item.hasNodes) {
            let toRm = ['searchTerm', 'type', 'groups', 'label', 'hasNodes', 'isOpen', 'key', 'openNodes'];
            let newObj = {};

            for (const itemKey in item) {
                if (!toRm.includes(itemKey)) {
                    newObj[itemKey] = item[itemKey]
                }
            }
            setCurrentItem(newObj)
            // if (item.citizenName) {
            //     toast.info(`${item.citizenName}, ${item.cityName}, ${item.cityData} жителей.`, {autoClose: 1500})
            // } else {
            //     toast.info(JSON.stringify(item))
            //
            // }
        }
    }

    function download(filename, text) {
        if (!text) {
            toast.warn('Для начала постройте иерархию!', {autoClose: 1500})
            return
        }

        text = JSON.stringify(text)
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }

    const updateTypes = (data) => {
        data.shift()
        setTypes(data.map(e => e.replaceAll(' ', '_')).map(e => e.replaceAll('\r', '')))
    }

    const updateContext = (data) => {
        let newTypes = data.shift()
        let transformed = transformUserXlsx(data, newTypes);
        updateTypes(newTypes)
        // let target = data.map(el => )
        setContext(transformed)
    }

    const transformUserXlsx = (rows, newTypes) => {
        let transformed = [];

        for (let i = 0; i < rows.length; i++) {
            let element = rows[i];
            let names = {}
            for (let j = 1; j < newTypes.length; j++) {
                let key = newTypes[j];
                names[String(key)] = '' + element[j];
            }

            for (let j = 1; j < newTypes.length; j++) {
                let obj = {};
                let key = newTypes[j];
                obj['id'] = element[0];
                obj['type'] = key;
                obj['name'] = '' + element[j];

                transformed.push({...obj, ...names})
            }
        }

        console.log(transformed)
        return transformed
    }

    return (
        <div className={styles.container}>
            <ToastContainer/>
            <div className={styles.container}>
                <Card>
                    <Card.Body>
                        <Card.Title>
                            <center>
                                Конструктор (генератор) json файлов на базе несгруппированных иерархических
                                данных в форматах xlsx и csv с поддержкой визуализации.
                            </center>
                        </Card.Title>
                    </Card.Body>
                </Card>
            </div>

            <div className={styles.container}>
                <Accordion defaultActiveKey="0">
                    <Accordion.Item eventKey="0">
                        <Accordion.Header>Прежде чем начать</Accordion.Header>
                        <Accordion.Body>
                            Наш генератор обрабатывает запросы, которые построены на определенных правилах.
                            Вот одни из примеров правильных запросов:
                            <br/> - "город улица",
                            <br/> - "страна город улица",
                            <br/> - "город улица дом / имя фамилия".
                            <br/>
                            <br/> Разберем последний запрос подробнее:
                            <ol>
                                <li>
                                    До символа "/" идет цепочка фильтров в том порядке в котором Вам нужно
                                    построить иерархию.
                                </li>
                                <li>
                                    Фильтры распознаются из Ваших загруженных файлов и представляют собой
                                    характеристики сущностей.
                                </li>
                                <li>
                                    [Опционально] после символа "/" могут идти имена характеристик, которые
                                    будут отображены при визуализации иерархии, по умолчанию отображается одна
                                    характеристика - уникальный идентификатор сущности.
                                </li>
                            </ol>

                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion>
            </div>

            <div className={styles.container}>
                <Accordion defaultActiveKey="0">
                    <Accordion.Item eventKey="0">
                        <Accordion.Header>Что такое цепочка фильтров и как её строить?</Accordion.Header>
                        <Accordion.Body>
                            Цепочка состоит из последовательно идущих фильтров разделенных пробелом. Вы можете
                            строить абсолютно любые иерархии, например, используя наши тестовые данных, помимо
                            банального примера город > район
                            > улица, можно составить следующую цепочку: улица > город или дом > город, такие
                            варианты могут быть полезными при анализе данных, то есть мы можем посмотреть кто
                            живет на одноименных улицах в разных городах и т.д. Ниже
                            представлены примеры возможных тестовых цепочек, но это только часть комбинаций,
                            придумайте
                            свою прямо сейчас или загрузите свои данные в форматах xlsx или csv!
                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion>
            </div>

            <div className={styles.carouselContainer}>
                <Carousel variant={"dark"}>
                    {chains.map((chain, index) => {
                        return (
                            <Carousel.Item key={chain}>
                                <img
                                    className="d-block w-100"
                                    height={"125px"}
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
                {types.length ? <>
                    <Accordion defaultActiveKey="0">
                        <Accordion.Item eventKey="0">
                            <Accordion.Header>Текущий набор фильтров</Accordion.Header>
                            <Accordion.Body>
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
                <Form.Group controlId="formFile" className="mb-3">
                    <Form.Label>В качестве демонстрации мы используем датасет с жителями Москвы, Питера и
                        Воронежа, но Вы может
                        загрузить свои данные в форматах xlsx и csv!</Form.Label>
                    <Form.Control type="file" ref={userDatasetRef} onChange={e => {
                        let file = e.target.files[0];

                        if (file.type === 'text/csv') {
                            const reader = new FileReader();

                            reader.onload = function (e) {
                                const str = e.target.result;

                                let rows = str.slice(str.indexOf("\n\r") + 1).split("\n");

                                rows = rows.map(r => r.split(','))

                                updateContext(rows)
                            };

                            reader.readAsText(file);
                        } else if (file) {
                            readXlsxFile(file).then((rows) => {
                                console.log(rows)
                                updateContext(rows)
                            })
                        } else {

                        }
                    }}/>
                </Form.Group>
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
                    <Button onClick={() => download(Date.now().toString(), treeData)}
                            variant="outline-primary" id="button-addon3">
                        Скачать результат
                    </Button>
                </InputGroup>
            </div>



            {treeData ?
                <div className={styles.container} style={{position: "sticky", top: '0'}}>
                    <Card>
                        <Card.Body>
                            <Card.Text>
                                Для вывода подробной информации выберите сущность.
                            </Card.Text>
                            <div style={{overflowX: "auto"}}>
                                <JSONViewer
                                    json={currentItem}
                                />
                            </div>

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
