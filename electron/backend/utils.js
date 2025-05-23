const api_teams =
  "f05ef6f78862d86508b9f2eae863fbf68f1686e19a4f1a09c59e0308c9dbfcbe";
const base_team = "https://team.socialboost.es";
const api_click = "pk_114126547_2W3MU14IYVOI8CV0XEIX4KG0Y4QH3UKX";
const clickup_team_id = "9011407330";

export async function findUser(id, source) {
  if (source === "team") {
    const headers = new Headers();
    headers.append("Authorization", "Basic " + btoa("apikey:" + api_teams));
    headers.append("Content-Type", "application/json");

    // Construir la URL con filtro directo por customField8
    let url = `${base_team}/api/v3/projects/?filters=[{"customField8":{"operator":"=","values":["${id}"]}}]`;

    const response = await fetch(url, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      console.error("Error fetching project:", response.statusText);
      return null;
    }

    const data = await response.json();
    const project =
      data._embedded.elements.length > 0 ? data._embedded.elements[0] : null;

    if (!project) {
      return { user_id: false, user_name: false };
    }

    return project;
  }

  if (source === "clickup") {
    const headers = new Headers();
    headers.append("Authorization", api_click);
    headers.append("Content-Type", "application/json");

    let url = `https://api.clickup.com/api/v2/team/${clickup_team_id}/list`;

    const response = await fetch(url, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      console.error("Error fetching lists:", response.statusText);
      return null;
    }

    const data = await response.json();
    const lists = data.lists || [];

    const foundList = lists.find((list) => list.name.includes(id));

    console.log(foundList);

    if (!foundList) {
      return { user_id: false, user_name: false };
    }

    return { user_id: foundList.id, user_name: foundList.name };
  }
}

export async function createTask(userData, uniqueId, info, template) {
  console.log(userData);

  // Implementar la lógica para crear una tarea en ClickUp/Team
  if (userData.source === "team") {
    // Ahora, modificar la descripción de la tarea en Team
    const headers = new Headers();
    headers.append("Authorization", "Basic " + btoa("apikey:" + api_teams));
    headers.append("Content-Type", "application/json");

    const url = `${base_team}/api/v3/projects/${userData.user_id}`;
    const body = JSON.stringify({
      description: {
        raw:
          "Sistema videos cortos: " +
          "https://short-videos.socialboost.es/public/" +
          uniqueId,
      },
    });

    const response = await fetch(url, {
      method: "PATCH",
      headers: headers,
      body: body,
    });

    if (!response.ok) {
      console.error("Error creating task:", response.statusText);
      return null;
    }

    const data = await response.json();
    return data;
  }

  if (userData.source === "clickup") {
    const headers = new Headers();
    headers.append("Authorization", api_click);
    headers.append("Content-Type", "application/json");

    const url = `https://api.clickup.com/api/v2/list/${userData.user_id}/task`;
    const body = JSON.stringify({
      name: "300 videos",
      description: "https://short-videos.socialboost.es/public/" + uniqueId,
    });

    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: body,
    });
    if (!response.ok) {
      console.error("Error creating ClickUp task:", response.statusText);
      return null;
    }

    return await response.json();
  }
}
