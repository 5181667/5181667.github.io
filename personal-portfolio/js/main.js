// 等待页面加载完成
document.addEventListener('DOMContentLoaded', () => {
    // 初始化所有功能
    initLoader();
    initNavbar();
    initBackToTop();
    initSkillsAnimation();
    loadProjects(); // 从JSON加载项目 - 先加载项目，再初始化过滤器
    initTypeWriter();
    initScrollAnimation();
    initContactForm();
    
    // 可以取消注释下面的行来动态生成作品项
    // generateWorkItems();
});

// 加载动画
function initLoader() {
    const loader = document.querySelector('.loader');
    
    // 延迟消失
    setTimeout(() => {
        loader.classList.add('fade-out');
        setTimeout(() => {
            loader.style.display = 'none';
        }, 500);
    }, 1200);
}

// 导航栏效果
function initNavbar() {
    const navbar = document.querySelector('.navbar');
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const navItems = document.querySelectorAll('.nav-links a');
    
    // 滚动时改变导航栏样式
    window.addEventListener('scroll', () => {
        if (window.scrollY > 30) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // 移动端菜单切换
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
    
    // 点击链接后关闭菜单
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navLinks.classList.remove('active');
            
            // 激活当前链接
            navItems.forEach(link => link.classList.remove('active'));
            item.classList.add('active');
        });
    });
    
    // 滚动监听，高亮当前区域的导航链接
    window.addEventListener('scroll', () => {
        let current = '';
        const sections = document.querySelectorAll('section');
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (window.scrollY >= (sectionTop - 150)) {
                current = section.getAttribute('id');
            }
        });
        
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${current}`) {
                item.classList.add('active');
            }
        });
    });
}

// 回到顶部按钮
function initBackToTop() {
    const backToTop = document.querySelector('.back-to-top');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            backToTop.classList.add('active');
        } else {
            backToTop.classList.remove('active');
        }
    });
    
    backToTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// 技能进度条动画
function initSkillsAnimation() {
    const skillsSection = document.querySelector('.skills-section');
    const progressBars = document.querySelectorAll('.skill-progress');
    
    function animateSkills() {
        progressBars.forEach(bar => {
            const progress = bar.getAttribute('data-progress');
            bar.style.width = `${progress}%`;
        });
    }
    
    // 监听滚动，进入视口时触发动画
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateSkills();
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });
    
    observer.observe(skillsSection);
}

// 作品筛选功能
function initWorkFilter() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const workItems = document.querySelectorAll('.work-item');
    
    // 确保默认显示所有项目
    workItems.forEach(item => {
        item.style.display = 'block';
        item.style.opacity = '1';
        item.style.transform = 'scale(1)';
    });
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // 移除所有按钮的激活状态
            filterBtns.forEach(btn => btn.classList.remove('active'));
            // 激活当前按钮
            btn.classList.add('active');
            
            const filterValue = btn.getAttribute('data-filter').toLowerCase();
            
            // 简化的筛选动画
            workItems.forEach(item => {
                const itemCategory = item.getAttribute('data-category').toLowerCase();
                if (filterValue === 'all' || itemCategory === filterValue) {
                    gsap.to(item, {
                        opacity: 1,
                        scale: 1,
                        duration: 0.4,
                        ease: 'power1.out',
                        clearProps: 'all',
                        onStart: () => {
                            item.style.display = 'block';
                        }
                    });
                } else {
                    gsap.to(item, {
                        opacity: 0,
                        scale: 0.95,
                        duration: 0.3,
                        ease: 'power1.in',
                        onComplete: () => {
                            item.style.display = 'none';
                        }
                    });
                }
            });
        });
    });
}

// 项目模态框
function initProjectModal() {
    const modal = document.querySelector('#projectModal');
    const closeBtn = document.querySelector('.close-modal');
    const projectLinks = document.querySelectorAll('.view-project');
    const projectDetails = document.querySelector('.project-details');
    
    // 打开模态框
    projectLinks.forEach((link, index) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // 获取对应的项目数据
            const projectItem = link.closest('.work-item');
            const projectId = projectItem.getAttribute('data-id');
            
            // 从window.projectsData获取项目数据
            const project = window.projectsData.find(p => p.id === projectId) || window.projectsData[index];
            
            // 获取类别文本
            let categoryText;
            const category = project.category.toLowerCase();
            switch (category) {
                case 'web':
                    categoryText = '网页设计';
                    break;
                case 'app':
                    categoryText = '应用设计';
                    break;
                case 'graphic':
                    categoryText = '平面设计';
                    break;
                default:
                    categoryText = '其他';
            }
            
            // 填充项目详情
            projectDetails.innerHTML = `
                <div class="project-header">
                    <h2>${project.title}</h2>
                    <p class="project-category">${categoryText}</p>
                </div>
                <div class="project-image">
                    <img src="${project.image}" alt="${project.title}">
                </div>
                <div class="project-info">
                    <div class="info-item">
                        <h4>客户</h4>
                        <p>${project.client}</p>
                    </div>
                    <div class="info-item">
                        <h4>日期</h4>
                        <p>${project.date}</p>
                    </div>
                    <div class="info-item">
                        <h4>技术</h4>
                        <div class="tech-tags">
                            ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                        </div>
                    </div>
                </div>
                <div class="project-description">
                    <h4>项目描述</h4>
                    <p>${project.description}</p>
                </div>
                <div class="project-actions">
                    <a href="${project.projectUrl}" class="btn primary-btn" target="_blank">前往项目 <i class="fas fa-external-link-alt"></i></a>
                </div>
            `;
            
            // 显示模态框
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });
    
    // 添加对卡片整体的点击处理
    const workItems = document.querySelectorAll('.work-item');
    workItems.forEach((item, index) => {
        const viewProjectLink = item.querySelector('.view-project');
        
        // 点击整个卡片区域（除了"前往项目"按钮外）打开模态框
        item.addEventListener('click', (e) => {
            // 如果点击的是"前往项目"按钮，不触发模态框
            if (e.target.classList.contains('visit-project') || e.target.closest('.visit-project')) {
                return;
            }
            
            // 模拟点击"查看详情"按钮
            if (viewProjectLink) {
                viewProjectLink.click();
            }
        });
    });
    
    // 关闭模态框
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    });
    
    // 点击模态框外部关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// 从JSON文件加载项目
function loadProjects() {
    // 显示加载中状态
    const worksGrid = document.querySelector('.works-grid');
    worksGrid.innerHTML = `
        <div class="loading-projects">
            <div class="spinner"></div>
            <p>加载作品中...</p>
        </div>
    `;

    // 由于本地文件访问限制，我们在这里硬编码项目数据
    const projectsData = [
        {
            "title": "WKG",
            "category": "app",
            "shortDesc": "网页设计 / UI",
            "client": "IOS用户",
            "date": "2025年5月",
            "description": "专注时光是一款简约而强大的专注计时应用，专为渴望提高工作和学习效率的人设计。通过科学的时间管理方法，帮助您在这个充满干扰的世界中找回专注力。",
            "image": "img/work-x.png",
            "technologies": ["Swift", "UI/UX/UX", "IOS"],
            "projectUrl": "https://appstore.com/1"
        },
        {
            "title": "AI网页",
            "category": "web",
            "shortDesc": "网页设计 / UI/UX",
            "client": "设计者/媒体工作者",
            "date": "2025年4月",
            "description": "AI网页是一款专注于设计者/媒体工作者的网页，它提供了一个简洁、易用的平台，让用户可以轻松地与朋友、家人和同事保持联系。",
            "image": "img/work-2.jpg",
            "technologies": ["HTML5", "CSS3", "JavaScript", "node.js", "AI"],
            "projectUrl": "https://www.hhcc.online/"
        },
        {
            "title": "旅行应用UI",
            "category": "app",
            "shortDesc": "应用设计 / UI",
            "client": "旅游公司",
            "date": "2023年3月",
            "description": "为旅行应用设计的极简UI界面，注重用户体验和功能直观性。采用清晰的视觉层次和简约的色彩方案，让用户能够轻松规划旅行。",
            "image": "img/work-1.jpg",
            "technologies": ["Figma", "Adobe XD", "Prototyping"],
            "projectUrl": "https://appstore"
        },
        {
            "title": "星露谷物语工具🔧",
            "category": "web",
            "shortDesc": "平面设计 / 标志",
            "client": "星露谷玩家",
            "date": "2024年12月",
            "description": "为星露谷玩家提供一个便捷的查找代码，并生成可用的格式，并提供一个简洁的界面，让玩家可以轻松地查找代码，并生成可用的格式。",
            "image": "img/work-3.jpg",
            "technologies": ["Python", "Flask", "HTML5", "CSS3", "JavaScript"],
            "projectUrl": "https://www.zxyhc.top/zf.html"
        }
    ];

    try {
        // 为每个项目添加唯一ID
        projectsData.forEach((project, index) => {
            project.id = `project-${index + 1}`;
        });
        
        // 保存到全局变量以便在模态框中使用
        window.projectsData = projectsData;
        
        // 清空作品网格
        worksGrid.innerHTML = '';
        
        // 生成项目HTML
        projectsData.forEach(project => {
            // 转换类别为小写以确保一致性
            const category = project.category.toLowerCase();
            
            // 根据类别设置显示文本
            let categoryText;
            switch (category) {
                case 'web':
                    categoryText = '网页设计';
                    break;
                case 'app':
                    categoryText = '应用设计';
                    break;
                case 'graphic':
                    categoryText = '平面设计';
                    break;
                default:
                    categoryText = '其他';
            }
            
            const workItem = document.createElement('div');
            workItem.className = 'work-item';
            workItem.setAttribute('data-category', category);
            workItem.setAttribute('data-id', project.id);
            
            workItem.innerHTML = `
                <div class="work-image">
                    <img src="${project.image}" alt="${project.title}">
                    <div class="work-overlay">
                        <div class="work-info">
                            <h3>${project.title}</h3>
                            <p>${project.shortDesc || categoryText}</p>
                            <div class="work-buttons">
                                <a href="#" class="view-project">查看详情</a>
                                <a href="${project.projectUrl}" class="visit-project" target="_blank">前往项目</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            worksGrid.appendChild(workItem);
        });
        
        // 重新初始化项目相关功能
        initProjectModal();
        initWorkFilter(); // 移动到这里，确保在项目加载后初始化过滤器
        
        // 添加淡入动画
        animateWorkItems();
        
        // 确保所有项目默认可见
        const workItems = document.querySelectorAll('.work-item');
        workItems.forEach(item => {
            item.style.display = 'block';
            item.style.opacity = '1';
        });
        
        // 确保"全部"按钮处于激活状态
        const allFilterBtn = document.querySelector('.filter-btn[data-filter="all"]');
        if (allFilterBtn) {
            allFilterBtn.classList.add('active');
        }
        
    } catch (error) {
        console.error('处理项目数据时出错:', error);
        showProjectsError(worksGrid);
    }
}

// 显示错误消息
function showProjectsError(container) {
    const errorMsg = document.createElement('div');
    errorMsg.className = 'error-message';
    errorMsg.textContent = '加载项目时出错，请刷新页面重试。';
    
    container.innerHTML = '';
    container.appendChild(errorMsg);
}

// 为作品项添加动画
function animateWorkItems() {
    const workItems = document.querySelectorAll('.work-item');
    
    workItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, 100 + index * 100);
    });
}

// 打字机效果
function initTypeWriter() {
    const typingElement = document.querySelector('.typing');
    const words = ['极简设计', '现代界面', '用户体验', '创新思维'];
    let wordIndex = 0;
    
    function typeWord(word) {
        let charIndex = 0;
        typingElement.textContent = '';
        
        const typeInterval = setInterval(() => {
            if (charIndex < word.length) {
                typingElement.textContent += word.charAt(charIndex);
                charIndex++;
            } else {
                clearInterval(typeInterval);
                setTimeout(deleteWord, 2000);
            }
        }, 150);
    }
    
    function deleteWord() {
        let word = typingElement.textContent;
        
        const deleteInterval = setInterval(() => {
            if (word.length > 0) {
                word = word.substring(0, word.length - 1);
                typingElement.textContent = word;
            } else {
                clearInterval(deleteInterval);
                wordIndex = (wordIndex + 1) % words.length;
                setTimeout(() => typeWord(words[wordIndex]), 500);
            }
        }, 80);
    }
    
    // 开始打字效果
    typeWord(words[wordIndex]);
}

// 滚动动画
function initScrollAnimation() {
    // 初始化GSAP ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);
    
    // 作品部分滚动动画 - 确保作品在滚动时可见
    ScrollTrigger.create({
        trigger: '.works-section',
        start: 'top 70%',
        onEnter: () => {
            const workItems = document.querySelectorAll('.work-item');
            workItems.forEach(item => {
                item.style.display = 'block';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            });
        }
    });
    
    // 关于部分动画 - 更加简洁的动画
    gsap.from('.about-image', {
        scrollTrigger: {
            trigger: '.about-section',
            start: 'top 75%'
        },
        y: 30,
        opacity: 0,
        duration: 0.8
    });
    
    gsap.from('.about-text', {
        scrollTrigger: {
            trigger: '.about-section',
            start: 'top 75%'
        },
        y: 30,
        opacity: 0,
        duration: 0.8,
        delay: 0.2
    });
    
    // 技能部分动画
    gsap.from('.skills-category', {
        scrollTrigger: {
            trigger: '.skills-section',
            start: 'top 75%'
        },
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2
    });
    
    // 联系部分动画
    gsap.from('.contact-info, .contact-form', {
        scrollTrigger: {
            trigger: '.contact-section',
            start: 'top 75%'
        },
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2
    });
}

// 联系表单功能
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    const messagesKey = 'portfolio_messages';
    
    // 仅在本地测试时保存消息到localStorage
    if (contactForm && window.location.protocol === 'file:') {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // 获取表单数据
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value;
            
            // 创建消息对象
            const messageData = {
                id: Date.now(),
                name,
                email,
                subject,
                message,
                date: new Date().toISOString()
            };
            
            // 保存到 localStorage (仅用于本地测试)
            saveMessage(messageData);
            
            // 显示成功消息
            showNotification('留言已成功提交！我们会尽快回复您。');
            
            // 清空表单
            this.reset();
        });
    } else if (contactForm) {
        // FormSubmit处理时，不需要阻止默认行为
        // 只需添加成功提交前的本地验证
        contactForm.addEventListener('submit', function(e) {
            // 可以添加额外的验证逻辑
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value;
            
            if (!name || !email || !subject || !message) {
                e.preventDefault();
                showNotification('请填写所有必填字段', 'error');
                return false;
            }
            
            // 如果验证通过，表单将正常提交到FormSubmit
        });
    }
    
    // 创建通知元素
    const notificationContainer = document.createElement('div');
    notificationContainer.className = 'notification-container';
    document.body.appendChild(notificationContainer);
    
    // 保存消息函数 (仅用于本地测试)
    function saveMessage(messageData) {
        try {
            // 获取现有消息
            const messages = JSON.parse(localStorage.getItem(messagesKey)) || [];
            
            // 添加新消息
            messages.push(messageData);
            
            // 保存回 localStorage
            localStorage.setItem(messagesKey, JSON.stringify(messages));
            
            console.log('留言已保存:', messageData);
            console.log('所有留言:', messages);
            
            return true;
        } catch (error) {
            console.error('保存留言时出错:', error);
            return false;
        }
    }
    
    // 显示通知函数
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        notificationContainer.appendChild(notification);
        
        // 淡入
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // 3秒后淡出并移除
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
}

// 新增：动态生成作品项函数
function generateWorkItems() {
    const worksGrid = document.querySelector('.works-grid');
    const projects = [
        // 项目数据数组可以单独存放在一个文件中进行管理
        // 这里仅作示例，实际使用时可以导入
        {
            title: '新项目示例',
            category: 'web',
            shortDesc: '网页设计 / 响应式',
            image: 'img/work-new.jpg',
            client: '客户名称',
            date: '2024年1月',
            description: '项目详细描述内容...',
            technologies: ['HTML5', 'CSS3', 'JavaScript']
        }
        // 可添加更多项目
    ];
    
    // 清空现有内容
    // worksGrid.innerHTML = '';
    
    // 生成新项目HTML
    projects.forEach(project => {
        const workItem = document.createElement('div');
        workItem.className = 'work-item';
        workItem.setAttribute('data-category', project.category);
        
        workItem.innerHTML = `
            <div class="work-image">
                <img src="${project.image}" alt="${project.title}">
                <div class="work-overlay">
                    <div class="work-info">
                        <h3>${project.title}</h3>
                        <p>${project.shortDesc}</p>
                        <a href="#" class="view-project">查看详情</a>
                    </div>
                </div>
            </div>
        `;
        
        worksGrid.appendChild(workItem);
    });
    
    // 重新初始化相关功能
    initWorkFilter();
    initProjectModal();
} 