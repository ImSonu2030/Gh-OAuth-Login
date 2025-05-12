import { useEffect, useState } from "react";
import Button from "./components/Button";
import UserInfo from "./components/UserInfo";
import Projects from "./components/Projects";
import AddedProject from "./components/AddedProject";

const BASE_URL = "http://localhost:4000";
const GH_CLIENT_ID = "Ov23li9NfqAcnJPLRd85";

function App() {
  const [userData, setUserData] = useState(null);
  const [loginState, setLoginState] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjectState] = useState([]);
  const [addedProject, setAddedProjects] = useState([]);

  useEffect(() => {
    const authURLString = window.location.search;
    const urlParams = new URLSearchParams(authURLString);
    const code = urlParams.get("code");

    if (localStorage.getItem("accessToken")) {
      setLoginState(true);
      return;
    }
    if (!code) {
      return;
    }

    getAccessToken(code);
    window.history.replaceState({}, document.title, window.location.pathname);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      return;
    }
    async function getUserData(accessToken) {
      const response = await fetch(`${BASE_URL}/getUserData`, {
        method: "GET",
        headers: {
          Authorization: "Bearer " + accessToken,
        },
      });
      const data = await response.json();
      if ((await checkIfUserExist(data.login)) == false) {
        createUser(data.login, accessToken);
      } else {
        console.log("session status check  ");

        sessionStatus(data.login);
      }
      setUserData(data);
      setIsLoading(false);
    }
    getUserData(token);
  }, [loginState]);

  async function getAccessToken(code) {
    const accessTokenEndPoint = `${BASE_URL}/getAccessToken?code=${code}`;
    const response = await fetch(accessTokenEndPoint);
    const data = await response.json();
    if (data.access_token) {
      localStorage.setItem("accessToken", data.access_token);
      setLoginState(true);
      setIsLoading(true);
    }
  }

  async function checkIfUserExist(username) {
    try {
      const serverEndPointUrl = `${BASE_URL}/checkUser?username=${encodeURIComponent(
        username
      )}`;
      const response = await fetch(serverEndPointUrl, {
        method: `GET`,
      });
      return (await response.json()).exists;
    } catch (error) {
      console.log("Error checking: ", error);
    }
  }
  async function sessionStatus(username) {
    try {
      const serverEndPointUrl = `${BASE_URL}/sessionStatus?username=${encodeURIComponent(
        username
      )}`;
      const response = await fetch(serverEndPointUrl, {
        method: "GET",
      });
      console.log(
        await response.json()
      ); /*{"expired": false}  OR {"expired": true}*/
    } catch (error) {
      console.log("Error checking: ", error);
    }
  }
  async function updateUser(username, column, newVal) {
    try {
      const serverEndPointUrl = `${BASE_URL}/updateUser`;
      const response = await fetch(serverEndPointUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          column: column,
          newValue: newVal,
        }),
      });
      const result = await response.json();
      console.log(result);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  }
  async function createUser(username, access_token) {
    try {
      const serverEndPointUrl = `${BASE_URL}/insert`;
      const response = await fetch(serverEndPointUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table_name: "users_superset",
          insert_object: {
            username: username,
            access_token: access_token,
            modified_date: new Date(),
          },
        }),
      });
      console.log(await response.json().message);
    } catch (error) {
      console.log("Failed:  ", error);
    }
  }

  async function addProject(url) {
    const serverEndPointUrl = `${BASE_URL}/addProject`;
    const response = await fetch(serverEndPointUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: userData.login,
        repolink: url,
      }),
    });
    console.log(await response.json());
    await fetchProjects(userData.login);
    return console.log("Invalid or Private Repository");
  }
  async function fetchProjects(username) {
    const serverEndPointUrl = `${BASE_URL}/fetchRow?user=${username}&table=projects`;
    const response = await fetch(serverEndPointUrl, {
      method: "GET",
    });

    const projectsList = await response.json();
    setAddedProjects(projectsList);
  }
  async function deleteProject(params) {
    console.log('delete projects called');
    
  }
  function fetchUserRepoData() {
    const token = localStorage.getItem("accessToken");
    async function fetchUserRepo(accessToken) {
      const serverEndPointUrl = `${BASE_URL}/fetchRepo`;
      const response = await fetch(serverEndPointUrl, {
        method: "GET",
        headers: {
          Authorization: "Bearer " + accessToken,
        },
      });
      const projects = await response.json();
      setProjectState(projects);
    }
    fetchUserRepo(token);
  }

  function generateRandomHexString(length) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      ""
    );
  }

  function logInWithGithub() {
    const state = generateRandomHexString(16);
    localStorage.setItem("CSRFToken", state);
    const params = new URLSearchParams({
      client_id: GH_CLIENT_ID,
      redirect_uri: "http://localhost:5173",
      scope: "repo,user",
      state: state,
      // prompt:'consent',
    });
    const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
    window.location.assign(authUrl);
  }

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("credentials");
    localStorage.removeItem("CSRFToken");
    setLoginState(false);
    setIsLoading(false);
    setUserData(null);
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  if (isLoading) {
    return (
      <div className="app">
        <h1>SparrowVPS</h1>
        <p>Loading...</p>
      </div>
    );
  }
  return (
    <div className="app">
      <h1>SparrowVPS</h1>
      {!userData ? (
        <>
          <p>Login or Register to ease the deployment process of projects</p>
          <header id="login-btns">
            <div id="gh-btn">
              <Button
                onSelectOption={logInWithGithub}
                btnImgSrc="https://img.icons8.com/?size=100&id=62856&format=png&color=f7f7f7"
                caption="Sign in with Github"
                width={35}
              />
            </div>
          </header>
        </>
      ) : (
        <>
          <header id="user-info">
            <UserInfo
              link={userData.html_url}
              imgUrl={userData.avatar_url}
              name={userData.name}
            />
            <Button
              onSelectOption={handleLogout}
              btnImgSrc="https://img.icons8.com/?size=100&id=vGj0AluRnTSa&format=png&color=000000"
              caption="Logout"
              width={30}
            />
          </header>
          <Projects
            onFetch={fetchUserRepoData}
            projects={projects}
            onSelect={addProject}
          />
          <AddedProject
          onSelect={fetchProjects}
          addedProjects={addedProject}
          user={userData.login}
          />
        </>
      )}
    </div>
  );
}
export default App;
