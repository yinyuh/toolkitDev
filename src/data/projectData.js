import imgNote from "../assets/img-projects/note-app.png";
import urbanStyle from "../assets/img-projects/urbanStyle.png";
import legalWeb from "../assets/img-projects/legalweb.webp";
import mediCare from "../assets/img-projects/medicare.jpg";
import astroFit from "../assets/img-projects/Astrofit.jpg";
import Verbenas from "../assets/img-projects/challenge-newyze.png";
import ReactEcommerce from "../assets/img-projects/ecommers.jpg";
import PortfolioDev from "../assets/img-projects/PortfolioDev.jpg";

export const proyectos = [
  {
    titulo: "React 电商",
    descripcion:
      "使用React、Node.js和MongoDB开发的全栈电商系统。包含认证、购物车、搜索、分类、评论等功能。",
    imagen: ReactEcommerce.src,
    tecnologias: ["React", "Tailwind", "Express", "MongoDB"],
    demo: "https://react-e-commerce-three-phi.vercel.app",
    codigo: "https://github.com/Lautaro-R-collins/React-E-commerce.git",
    categoria: "fullstack",
  },
  {
    titulo: "组织应用",
    descripcion:
      "使用MERN栈开发的全栈应用，具有CRUD功能、看板和列表创建、用户认证等功能。",
    imagen: imgNote.src,
    tecnologias: ["React", "Tailwind", "Express", "MongoDB"],
    demo: "https://front-react-todo.onrender.com",
    codigo: "https://github.com/Lautaro-R-collins/Front-react-todo",
    categoria: "fullstack",
  },
  {
    titulo: "Urban Style 电商",
    descripcion:
      "使用React开发的功能性服装和配饰电商，包含购物车、分类和支付网关。",
    imagen: urbanStyle.src,
    tecnologias: ["React", "Tailwind", "Firebase"],
    demo: "https://proyecto-final-rodriguez-sable.vercel.app/",
    codigo: "https://github.com/Lautaro-R-collins/ProyectoFinal-Rodriguez.git",
    categoria: "fullstack",
  },
  {
    titulo: "手工艺品商店",
    descripcion:
      "全栈电商平台，用于查看、购买和销售产品，包含用户和卖家登录功能。",
    imagen:
      "https://i.pinimg.com/736x/c9/70/bf/c970bfbc24489e39418b2c1b1f8f74ef.jpg",
    tecnologias: ["React", "Node", "Express", "MongoDB"],
    demo: "https://c21-05-ft-node-react-mirror-frontend-64qbwssi2-muyvisual.vercel.app/",
    codigo: "https://github.com/No-Country-simulation/c21-05-ft-node-react",
    categoria: "fullstack",
  },
  {
    titulo: "收支追踪器",
    descripcion:
      "执行CRUD操作的应用，用于添加、查看、编辑和删除收入/支出。",
    imagen:
      "https://i.pinimg.com/736x/a4/85/c4/a485c4da3e78f4f518ddbcdb6637bacf.jpg",
    tecnologias: ["React", "contextAPI"],
    demo: "https://traker-gastos-ingresos.onrender.com/",
    codigo: "https://github.com/Lautaro-R-collins/Traker-Gastos-Ingresos",
    categoria: "frontend",
  },
  {
    titulo: "天气应用",
    descripcion:
      "使用React开发的应用，通过API显示实时天气信息。",
    imagen:
      "https://i.pinimg.com/736x/10/6e/cd/106ecd1bfe5ed1c3defb83ea0f87a334.jpg",
    tecnologias: ["React", "contextAPI", "tailwind"],
    demo: "https://app-clima-om19.onrender.com/",
    codigo: "https://github.com/Lautaro-R-collins/app-clima",
    categoria: "frontend",
  },
  {
    titulo: "开发者作品集",
    descripcion:
      "这是一个使用Astro和Tailwind CSS构建的现代化响应式开发者作品集。",
    imagen: PortfolioDev.src,
    tecnologias: ["Astro", "tailwind", "JavaScript"],
    demo: "https://portfolio-developers-astro.vercel.app/",
    codigo:
      "https://github.com/Lautaro-R-collins/Portfolio-developers-astro.git",
    categoria: "frontend",
  },

  {
    titulo: "法律团队",
    descripcion:
      "使用Astro和Tailwind开发的法律事务所营销漏斗网站。",
    imagen: legalWeb.src,
    tecnologias: ["Astro", "tailwind", "JavaScript"],
    demo: "https://legal-staff.vercel.app/",
    codigo: "https://github.com/Lautaro-R-collins/legal-staff",
    categoria: "frontend",
  },
  {
    titulo: "医疗保险",
    descripcion:
      "使用Astro和Tailwind开发的社会保险营销漏斗网站。",
    imagen: mediCare.src,
    tecnologias: ["Astro", "tailwind", "JavaScript"],
    demo: "https://obra-social-landing.vercel.app/",
    codigo: "https://github.com/Lautaro-R-collins/obra-social-landing.git",
    categoria: "frontend",
  },
  {
    titulo: "健身顾问",
    descripcion:
      "使用Astro和Tailwind开发的健身顾问营销漏斗网站。",
    imagen: astroFit.src,
    tecnologias: ["Astro", "tailwind", "JavaScript"],
    demo: "https://gym-page-sandy.vercel.app/",
    codigo: "https://github.com/Lautaro-R-collins/GymPage.git",
    categoria: "frontend",
  },
  {
    titulo: "电商REST API",
    descripcion:
      "使用Node.js、Express和MongoDB构建的RESTful API，用于管理具有CRUD操作的任务、用户注册和JWT登录。",
    imagen: "https://miro.medium.com/1*47S4iWVwTicFkFL4-Z4uAA.png",
    tecnologias: ["Express", "Node.js", "MongoDB", "Mongoose"],
    demo: "https://react-e-commerce-three-phi.vercel.app/",
    codigo: "https://github.com/Lautaro-R-collins/ApiRest-Ecommerce.git",
    categoria: "backend",
  },
  {
    titulo: "REST API",
    descripcion:
      "使用Express和MongoDB构建的RESTful API，用于管理具有CRUD操作的任务、用户注册和JWT登录。",
    imagen: "https://miro.medium.com/1*47S4iWVwTicFkFL4-Z4uAA.png",
    tecnologias: ["Express", "Node.js", "MongoDB", "Mongoose"],
    demo: "https://back-express-todo.onrender.com",
    codigo: "https://github.com/Lautaro-R-collins/Back-express-todo.git",
    categoria: "backend",
  },
  {
    titulo: "PlaniFy",
    descripcion:
      "用于组织项目的Web应用，使用React + Vite、TypeScript和Tailwind进行样式设计。",
    imagen:
      "https://i.pinimg.com/736x/8f/f0/bb/8ff0bbd0e5844ed254bede44522c8338.jpg",
    tecnologias: ["React", "Vite", "TypeScript", "Tailwind"],
    demo: "https://planify-1tu6.onrender.com/",
    codigo: "https://github.com/Lautaro-R-collins/PlaniFy-organization-app",
    categoria: "frontend",
  },
  {
    titulo: "Verbenas 景观",
    descripcion:
      "使用Astro和Tailwind开发的静态页面，作为初创公司的挑战项目。",
    imagen: Verbenas.src,
    tecnologias: ["Astro", "Tailwind", "JavaScript"],
    demo: "https://challenge-neowyze.onrender.com/",
    codigo: "https://github.com/Lautaro-R-collins/challenge-Neowyze.git",
    categoria: "frontend",
  },

  {
    titulo: "100天JS编程",
    descripcion: "使用HTML、CSS和JavaScript完成的100个项目。",
    imagen:
      "https://i.pinimg.com/736x/3b/4f/4e/3b4f4e170fcb1795b88f4941f49df0a2.jpg",
    tecnologias: ["Next.js", "Tailwind", "GraphQL"],
    demo: "https://one00-proyects-web.onrender.com/",
    codigo: "https://github.com/Lautaro-R-collins/100-days-of-coding-in-JS",
    categoria: "frontend",
  },
];