export default function ProjectItem({ projects,onSelect }) {
  function formattedDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  }
  if (projects.length===0) {
    return <p id="no-project-msg">Please fetch the repo to view all projects</p>;
  }
  return (
    <ul>
      {projects.map((project, indx) => {
        return (
          <li key={indx}> 
            <span><img src="https://img.icons8.com/?size=100&id=2778&format=png&color=f7f7f7" alt="" /></span>
            <section>
              <span id="project-name">
                <a href={project.html_url}>{project.full_name}</a>
                <button onClick={()=>onSelect(project.html_url)} >+</button>
              </span>
              <span id="project-metadata">
                <span>
                  <p id="visibility">{project.visibility}</p>
                  <p >
                    <code>{project.language}</code>
                  </p>
                </span>
                <span id="modified-date">
                  <p>Created on: {formattedDate(project.created_at)}</p>
                </span>
              </span>
            </section>
          </li>
        );
      })}
    </ul>
  );
}

/*
{
    "full_name": "r3dacted42/sparrow-vps",
    "html_url": "https://github.com/r3dacted42/sparrow-vps",
    "visibility": "public",
    "created_at": "2025-04-15T11:26:56Z",
    "language": "Vue"
}
*/
