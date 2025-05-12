import { useState } from "react";
import ProjectItem from './ProjectItem.jsx'

export default function Projects({ onFetch, projects, onSelect }) {
  const [isRotating, setIsRotating] = useState(false);

  const handleClick = async () => {
    setIsRotating(true);
    await onFetch();
    setTimeout(() => setIsRotating(false), 1000);
  };

  return (
    <div id="project-details">
      <button id="repo-fetchbtn" onClick={handleClick}>
        <span
          className={`material-symbols-outlined ${
            isRotating ? "rotating" : ""
          }`}
        >
          refresh
        </span>
        <p>Fetch Repo</p>
      </button>
      <ProjectItem projects={projects} onSelect={onSelect}/>
    </div>
  );
}
