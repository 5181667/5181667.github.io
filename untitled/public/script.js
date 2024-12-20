// public/script.js
let editingTodoId = null; // 用于跟踪正在编辑的待办事项

// 获取待办事项
async function fetchTodos() {
    const response = await fetch('/todos');
    const todos = await response.json();
    todoList.innerHTML = '';
    todos.forEach(todo => {
        const li = document.createElement('li');
        li.textContent = todo.text;
        if (todo.completed) {
            li.classList.add('completed');
        }
        li.onclick = () => toggleTodo(todo.id);

        // 添加编辑按钮
        const editButton = document.createElement('button');
        editButton.textContent = '编辑';
        editButton.onclick = (e) => {
            e.stopPropagation();
            editTodo(todo);
        };

        const deleteButton = document.createElement('button');
        deleteButton.textContent = '删除';
        deleteButton.onclick = (e) => {
            e.stopPropagation();
            deleteTodo(todo.id);
        };

        li.appendChild(editButton);
        li.appendChild(deleteButton);
        todoList.appendChild(li);
    });
}
let filter = 'all'; // 默认过滤状态

// 获取待办事项
async function fetchTodos() {
    const response = await fetch('/todos');
    const todos = await response.json();
    todoList.innerHTML = '';
    todos.forEach(todo => {
        if (filter === 'completed' && !todo.completed) return;
        if (filter === 'incomplete' && todo.completed) return;

        const li = document.createElement('li');
        li.textContent = todo.text;
        if (todo.completed) {
            li.classList.add('completed');
        }
        li.onclick = () => toggleTodo(todo.id);

        const editButton = document.createElement('button');
        editButton.textContent = '编辑';
        editButton.onclick = (e) => {
            e.stopPropagation();
            editTodo(todo);
        };

        const deleteButton = document.createElement('button');
        deleteButton.textContent = '删除';
        deleteButton.onclick = (e) => {
            e.stopPropagation();
            deleteTodo(todo.id);
        };

        li.appendChild(editButton);
        li.appendChild(deleteButton);
        todoList.appendChild(li);
    });
}
// 保存待办事项到本地存储
function saveTodosToLocalStorage() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

// 从本地存储加载待办事项
function loadTodosFromLocalStorage() {
    const storedTodos = localStorage.getItem('todos');
    if (storedTodos) {
        todos = JSON.parse(storedTodos);
        idCounter = todos.length ? Math.max(todos.map(todo => todo.id)) + 1 : 1; // 更新 ID 计数器
    }
}

// 在初始化时加载待办事项
loadTodosFromLocalStorage();
// 过滤待办事项
document.getElementById('allButton').onclick = () => {
    filter = 'all';
    fetchTodos();
};

document.getElementById('completedButton').onclick = () => {
    filter = 'completed';
    fetchTodos();
};

document.getElementById('incompleteButton').onclick = () => {
    filter = 'incomplete';
    fetchTodos();
};

// 编辑待办事项
function editTodo(todo) {
    todoInput.value = todo.text; // 将待办事项文本填入输入框
    editingTodoId = todo.id; // 设置正在编辑的待办事项 ID
}

// 添加待办事项
addButton.onclick = async () => {
    const text = todoInput.value;
    if (text) {
        if (editingTodoId) {
            // 更新待办事项
            await fetch(`/todos/${editingTodoId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            editingTodoId = null; // 清空编辑状态
        } else {
            // 添加新待办事项
            await fetch('/todos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
        }
        todoInput.value = '';
        fetchTodos();
    }
};