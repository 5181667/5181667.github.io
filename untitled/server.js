import express from 'express';
import bodyParser from 'body-parser';

const app = express();
const port = 3000;

let ownTasks = [];
let partnerTasks = [];

app.use(bodyParser.json());
app.use(express.static('public'));

// 获取任务
app.get('/tasks', (req, res) => {
    res.json({ ownTasks, partnerTasks });
});

// 添加任务
app.post('/addTask', (req, res) => {
    const { type, task } = req.body;
    if (type === 'own') {
        ownTasks.push(task);
    } else if (type === 'partner') {
        partnerTasks.push(task);
    }
    res.status(200).send('Task added successfully');
});

// 删除任务
app.post('/deleteTask', (req, res) => {
    const { type, taskIndex } = req.body;

    if (type === 'own' && ownTasks[taskIndex]) {
        ownTasks.splice(taskIndex, 1);
    } else if (type === 'partner' && partnerTasks[taskIndex]) {
        partnerTasks.splice(taskIndex, 1);
    } else {
        return res.status(400).send('Invalid task type or index');
    }

    res.status(200).send('Task deleted successfully');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
