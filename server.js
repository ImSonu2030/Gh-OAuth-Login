var cors = require("cors");
var express = require("express");
var url = require("url");
var { createClient } = require("@supabase/supabase-js");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
require("dotenv").config();

const serverPort = process.env.PORT;
const superbaseURL = process.env.SUPERBASE_DB_URL;
const superbaseAPIKEY = process.env.SUPERBASE_API_KEY;

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(",");

var app = express();
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // optional: allow cookies/auth headers
  })
);
app.use(express.json());
const supabase = createClient(superbaseURL, superbaseAPIKEY);
// ----------------------------------------------------------
async function doesEntryExist(tablename, column, value) {
  try {
    const { data, error } = await supabase
      .from(tablename)
      .select(column)
      .eq(column, value)
      .limit(1);
    if (error) {
      console.log("Supabase error:  ", error);
      return false;
    }
    return data.length > 0;
  } catch (error) {
    console.error("Server error: ", error);
    return false;
  }
}
async function readtRow(params) {}
app.get("/checkUser", async function (request, response) {
  const username = request.query.username;

  try {
    const exists = await doesEntryExist("users_superset", "username", username);

    return response.json({ exists });
  } catch (error) {
    console.error("Server error: ", error);
    return response
      .status(500)
      .json({ error: "Server error", details: err.message });
  }
});

app.get("/sessionStatus", async function (request, response) {
  const username = request.query.username;
  const sessionLimit = 1;
  try {
    const { data, error } = await supabase
      .from("users_superset")
      .select("modified_date")
      .eq("username", username);

    if (error) {
      console.log("superbase error:  ", error);
    }

    const firstSession = new Date(data[0].modified_date);
    const currTime = new Date();
    const currSession = Math.floor((currTime - firstSession) / 60000);

    return response.json({ expired: currSession >= sessionLimit });
  } catch (error) {
    return response.status(500).json({ error: "Server error", details: error });
  }
});

app.post("/insert", async function (request, response) {
  const { table_name, insert_object } = request.body;

  try {
    const { data, error } = await supabase
      .from(table_name)
      .insert([insert_object])
      .select();

    if (error) {
      return response
        .status(500)
        .json({ error: "Database error", details: error });
    }

    return response.status(200).json({
      message: `Data inserted into ${table_name} successfully`,
      data: data,
    });
  } catch (error) {
    return response.status(500).json({ error: "Server error", details: error });
  }
});

app.put("/updateUser", async function (request, response) {
  const { username, column, newValue } = request.body;

  const updateObject = { column: newValue };
  console.log("updated data:  ");

  console.log(updateObject);

  updateObject[column] = newValue;
  try {
    const { data, error } = await supabase
      .from("users_superset")
      .update(updateObject)
      .eq("username", username)
      .select();
    console.log(data);

    if (error) {
      return response
        .status(500)
        .json({ error: "Database error", details: error });
    }
    return response
      .status(200)
      .json({ message: "Updated successfully", data: data });
  } catch (error) {
    return response.status(500).json({ error: "Server error", details: error });
  }
});

app.get("/validateGitUrl", async function (request, response) {
  try {
    const giturl = request.query.url;
    const parseUrl = new URL(giturl);
    const splitUrl = parseUrl.pathname.split("/").filter(Boolean);
    const owner = splitUrl[0];
    const repo = splitUrl[1].replace(".git", "");
    const apiEndPointUrl = `https://api.github.com/repos/${owner}/${repo}`;

    const responseReceived = await fetch(apiEndPointUrl, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "git-repo-validator",
      },
    });

    const status = await responseReceived.json();
    const isValid = !status.message || status.message !== "Not Found";

    response.json({ isValid });
  } catch (error) {
    console.log("server error " + error);
    response.status(500).json({ error: "Failed to validate repository" });
  }
});
async function checkTableExists(tablename) {
  try {
    const { data, error } = await supabase.rpc("validatetable", {
      tablename: tablename,
    });

    if (error) {
      console.error("Error checking table existence:", error);
      throw new Error("Failed to check table existence");
    }
    return data;
  } catch (error) {
    console.error("Table existence check failed:", error);
    throw error;
  }
}
async function createTable(tableName, schemaDefinition) {
  try {
    const { data, error } = await supabase.rpc("creattable", {
      table_name: tableName,
      table_definition: schemaDefinition,
    });

    if (error) {
      console.error("Error creating table:", error);
      throw new Error("Failed to create table");
    }
    console.log(data);

    return true;
  } catch (error) {
    console.error("Table creation failed:", error);
    throw error;
  }
}

app.post("/addProject", async (request, response) => {
  try {
    const { user, repolink } = request.body;
    const tablename = "projects";
    const column = "repourl";

    const validationResponse = await fetch(
      `${request.protocol}://${request.get(
        "host"
      )}/validateGitUrl?url=${encodeURIComponent(repolink)}`
    );
    const validationResult = await validationResponse.json();

    if (!validationResult.isValid) {
      return response
        .status(400)
        .json({ error: "Invalid GitHub repository URL" });
    }

    const exists = await doesEntryExist(tablename, column, repolink);
    if (exists) {
      return response.status(200).json({
        message: `${repolink}  repo already exist`,
      });
    }

    const { data, error } = await supabase
      .from(tablename)
      .insert([{ user: user, repourl: repolink }])
      .select();

    if (error) {
      return response
        .status(500)
        .json({ error: "Database error", details: error });
    }

    return response.status(200).json({
      message: `Project added successfully to ${tablename}`,
      data: data,
    });
  } catch (error) {
    console.error("Error adding project:", error);
    return response
      .status(500)
      .json({ error: "Server error", details: error.message });
  }
});

app.get("/fetchRow", async (request, response) => {
  try {
    const user = request.query.user;
    const tableName = request.query.table;

    const { data, error } = await supabase.from(tableName).select("*").eq('user',user);
    console.log("Row fetched :  ", data);
    if (error) {
      console.log("DataBase Error:  ", error);
    }
    return response.json(data);
  } catch (error) {
    console.log("Error Fetching projects: ", error);
    return response.json();
  }
});
// ----------------------------------------------------------
app.get("/getAccessToken", async function (request, response) {
  const params =
    "?client_id=" +
    CLIENT_ID +
    "&client_secret=" +
    CLIENT_SECRET +
    "&code=" +
    request.query.code;
  const accessTokenEndPoint = `https://github.com/login/oauth/access_token${params}`;
  try {
    await fetch(accessTokenEndPoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    })
      .then((responseRecived) => {
        return responseRecived.json();
      })
      .then((data) => {
        response.json(data);
      });
  } catch (error) {
    console.log("Error getting Access Token:  " + error);
    return null;
  }
});

app.get("/getUserData", async function (request, response) {
  const authHeader = request.get("Authorization");
  try {
    await fetch("https://api.github.com/user", {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "User-Agent": "Node.js",
      },
    })
      .then((responseRecived) => {
        return responseRecived.json();
      })
      .then((data) => {
        console.log(data);

        response.json(data);
      });
  } catch (error) {
    console.log("Error fetching User info: " + error);
    return null;
  }
});

app.get("/fetchRepo", async function (request, response) {
  const authHeader = request.get("Authorization");
  try {
    const ghRepoFetchEndPoint =
      "https://api.github.com/user/repos?per_page=100&sort=updated";
    await fetch(ghRepoFetchEndPoint, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    })
      .then((responseRecived) => {
        return responseRecived.json();
      })
      .then((projects) => {
        console.log(projects);
        response.json(
          projects.map((project) => {
            return {
              full_name: project.full_name,
              html_url: project.html_url,
              visibility: project.visibility,
              created_at: project.created_at,
              language: project.language,
            };
          })
        );
      });
  } catch (error) {
    console.error("Error fetching repositories:", error);
  }
});

app.listen(serverPort, function () {
  console.log("Server running at the port 4000");
});
