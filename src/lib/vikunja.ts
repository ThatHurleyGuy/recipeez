export async function createVikunjaTask(title: string, description: string): Promise<{ id: number }> {
  const baseUrl = process.env.VIKUNJA_URL;
  const token = process.env.VIKUNJA_API_TOKEN;
  const projectId = process.env.VIKUNJA_PROJECT_ID;

  if (!baseUrl || !token || !projectId) {
    throw new Error("VIKUNJA_URL, VIKUNJA_API_TOKEN, and VIKUNJA_PROJECT_ID must be configured");
  }

  const path = `/api/v1/projects/${encodeURIComponent(projectId)}/tasks`;
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ title, description })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Vikunja task create failed: ${response.status} ${body}`);
  }

  return response.json();
}
