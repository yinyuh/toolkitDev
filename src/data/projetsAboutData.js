import urbanStyle from "../assets/img-projects/urbanStyle.png";
import imgNote from "../assets/img-projects/note-app.png";
import ReactEcommerce from "../assets/img-projects/ecommers.jpg";

export const proyectos = [
  {
    titulo: "React 电商",
    imagen: ReactEcommerce.src,
    tecnologias: ["React", "Tailwind", "Node.js" ,"Express", "MongoDB", "jwt"],
    demo: "https://react-e-commerce-three-phi.vercel.app",
    codigo: "https://github.com/Lautaro-R-collins/React-E-commerce.git",
  },
  {
    titulo: "Urban Style 电商",
    descripcion: "项目1的简要描述。",
    imagen: urbanStyle.src,
    tecnologias: ["React", "Tailwind", "Firebase"],
    demo: "https://proyecto-final-rodriguez-sable.vercel.app/",
    codigo: "https://github.com/Lautaro-R-collins/ProyectoFinal-Rodriguez.git",
  },
  {
    titulo: "组织应用",
    imagen: imgNote.src,
    tecnologias: ["React", "Tailwind", "Express", "MongoDB"],
    demo: "https://front-react-todo.onrender.com",
    codigo: "https://github.com/Lautaro-R-collins/Front-react-todo",
  },
  {
    titulo: "电商REST API",
    imagen: "https://miro.medium.com/1*47S4iWVwTicFkFL4-Z4uAA.png",
    tecnologias: ["Express", "Node.js", "MongoDB", "Mongoose"],
    demo: "https://react-e-commerce-three-phi.vercel.app/",
    codigo: "https://github.com/Lautaro-R-collins/ApiRest-Ecommerce.git",
  },
];