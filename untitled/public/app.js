// app.js

const tasks = {
    own: [],
    partner: []
};

// 添加任务
function addTask(type) {
    const taskInput = document.getElementById(`${type}-task-input`);
    const deadlineInput = document.getElementById(`${type}-task-deadline`);

    if (!taskInput.value) {
        alert("任务不能为空！");
        return;
    }

    const task = {
        id: new Date().getTime(),
        text: taskInput.value,
        deadline: deadlineInput.value,
        completed: false
    };

    // 添加任务到相应的列表
    tasks[type].push(task);
    displayTasks(type);

    // 清空输入框
    taskInput.value = '';
    deadlineInput.value = '';
}

// 显示任务
function displayTasks(type) {
    const taskList = document.getElementById(`${type}-task-list`);
    taskList.innerHTML = '';

    tasks[type].forEach(task => {
        const li = document.createElement('li');
        li.classList.add(task.completed ? 'completed' : '');
        li.innerHTML = `
      <span>${task.text}</span>
      <span>截止日期: ${task.deadline}</span>
      <button class="complete-btn" onclick="markCompleted('${type}', ${task.id})">✔️</button>
      <button class="delete-btn" onclick="removeTask('${type}', ${task.id})">🗑️</button>
    `;
        taskList.appendChild(li);
    });
}

// 标记任务为完成
function markCompleted(type, taskId) {
    const task = tasks[type].find(t => t.id === taskId);
    if (task) {
        task.completed = true;
        displayTasks(type);
    }
}

// 删除任务
function removeTask(type, taskId) {
    tasks[type] = tasks[type].filter(t => t.id !== taskId);
    displayTasks(type);
}

// 导出任务为 JSON 文件
function exportTasks(type) {
    const blob = new Blob([JSON.stringify(tasks[type], null, 2)], {
        type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-tasks.json`;
    a.click();
    URL.revokeObjectURL(url);
}
