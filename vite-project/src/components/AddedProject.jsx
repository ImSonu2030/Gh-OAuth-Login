export default function AddedProject({ onSelect, addedProjects, user }) {
  return (
    <>
      <button onClick={() => onSelect(user)}> Fetch projects</button>
      {addedProjects.length === 0 ? (
        <p>No Projects to show</p>
      ) : (
        <ul>
          {addedProjects.map((project, indx) => {
            return <li key={indx}>{project.repourl}</li>;
          })}
        </ul>
      )}
    </>
  );
}
