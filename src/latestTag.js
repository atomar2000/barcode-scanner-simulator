import { Octokit } from "@octokit/core";

export async function getLatestTagJson() {
  const octokit = new Octokit({
    auth: "",
  });

  const response = await octokit.request(
    "GET /repos/atomar2000/barcode-scanner-simulator/releases/latest",
    {
      owner: "atomar2000",
      repo: "barcode-scanner-simulator",
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );
  return response;
}
