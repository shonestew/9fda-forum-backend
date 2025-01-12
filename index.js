const mongoose = require('mongoose');
const { Schema } = mongoose;
const fastify = require('fastify')({
    logger: true
});
const cors = require('@fastify/cors');
require('dotenv').config();

fastify.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
});

const topicSchema = new Schema({
    title: String,
    text: String,
    author: String,
    date: {
        day: Number,
        month: Number,
        year: Number,
    },
    subject: String,
    topic_id: Number,
});
const Topic = mongoose.model('Topic', topicSchema);

const subjectSchema = new Schema({
    id: Number,
    name: String,
});
const Subject = mongoose.model('Subject', subjectSchema);

const topicCommentSchema = new Schema({
    author: String,
    text: String,
    date: {
        day: Number,
        month: Number,
        year: Number,
    },
    topic_id: Number,
});
const TopicComment = mongoose.model('topiccomment', topicCommentSchema);

mongoose.connect(process.env.URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('\n!!! Подключено к MongoDB !!!\n'))
    .catch((error) => console.error('Ошибка подключения:', error));

fastify.get('/api/v1/get_topics', async (req, res) => {
    try {
        const newTopics = await Topic.find({});

        if (newTopics.length === 0) {
            return res.status(404).send({ status: 404, message: 'No topics found' });
        } else {
            return res.status(200).send(newTopics);
        }
    } catch (e) {
        console.error('Ошибка при запросе к базе данных:', e);
        return res.status(500).send({ status: 500, message: 'Internal server error' });
    }
});

fastify.get('/api/v1/get_topics_one/:id', async (req, res) => {
    try {
        const topic_id = req.params.id;
        const newTopics = await Topic.find({ topic_id });

        if (newTopics.length === 0) {
            return res.status(404).send({ status: 404, message: 'No topics found' });
        } else {
            return res.status(200).send(newTopics);
        }
    } catch (e) {
        console.error('Ошибка при запросе к базе данных:', e);
        return res.status(500).send({ status: 500, message: 'Internal server error' });
    }
});

fastify.get('/api/v1/get_subjects', async (req, res) => {
    try {
        const subjects = await Subject.find({});

        if (subjects.length === 0) {
            return res.status(404).send({ status: 404, message: 'No topics found' });
        } else {
            return res.status(200).send(subjects);
        }
    } catch (e) {
        console.error('Ошибка при запросе к базе данных:', e);
        return res.status(500).send({ status: 500, message: 'Internal server error' });
    }
});

fastify.get('/api/v1/get_topic_info/:id', async (req, res) => {
    try {
        const topicId = req.params.id;
        console.log(`\nОтправили запрос на получение инфы об топике по айди: ${topicId}\n`)
        
        const comments = await TopicComment.find({ topic_id: topicId });

        if (comments.length === 0) {
            return res.status(404).send({ status: 404, message: 'No topics found' });
        } else {
            return res.status(200).send(comments);
        };
    } catch (e) {
        console.log("Ошибка при получении информации об топике через айди:", e);
        return res.status(500).send({ status: 500, message: 'Internal server error' });
    };
});

fastify.post('/api/v1/send_comment/', async (req, res) => {
    try {
        const newComment = new TopicComment(req.body);
        
        await newComment.save()
            .then(() => console.log("Комментарий сохранён!"))
            .catch(e => console.log("Ошибка при сохранении данных на б/д:", e));
    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: 500, message: 'Internal server error' });
    };
});

// Тут добавить бы прослушивание отправки запроса на создание топиков, но пока без него

const stopServer = async () => {
    try {
        await mongoose.connection.close();
        console.log('\n!!!Соединение с MongoDB закрыто!!!\n');
        await fastify.close();
        console.log('Server closed');
    } catch (error) {
        console.error('Error during shutdown:', error);
    }
};

fastify.addHook('onClose', async (instance, done) => {
    await stopServer();
    done();
});

const startServer = async () => {
    try {
        await fastify.listen({ port: 8080 });
        console.log('Server is running on port 8080');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT. Closing server...');
    await stopServer();
    process.exit(0);
});

startServer();