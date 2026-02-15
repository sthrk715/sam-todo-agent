import { Octokit } from "octokit";
import type { Task, CreateTaskInput, Repo } from "@/types";

function getConfig() {
  const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
  const owner = process.env.NEXT_PUBLIC_GITHUB_OWNER;

  if (!token || !owner) {
    throw new Error(
      "環境変数が未設定です: NEXT_PUBLIC_GITHUB_TOKEN, NEXT_PUBLIC_GITHUB_OWNER"
    );
  }

  return { token, owner };
}

function getOctokit() {
  const { token } = getConfig();
  return new Octokit({ auth: token });
}

export async function fetchRepos(): Promise<Repo[]> {
  const octokit = getOctokit();

  // 認証ユーザーのリポジトリ一覧（privateを含む）
  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: "updated",
    per_page: 100,
  });

  return data.map((r) => ({
    name: r.name,
    fullName: r.full_name,
    description: r.description || "",
    private: r.private,
  }));
}

export async function createIssue(input: CreateTaskInput): Promise<Task> {
  const octokit = getOctokit();
  const { owner } = getConfig();

  const labels: string[] = ["ai-task"];
  if (input.label) labels.push(input.label);

  const { data } = await octokit.rest.issues.create({
    owner,
    repo: input.repo,
    title: input.title,
    body: input.description || "",
    labels,
  });

  return mapIssueToTask(data, input.repo);
}

export async function fetchIssues(repo: string): Promise<Task[]> {
  const octokit = getOctokit();
  const { owner } = getConfig();

  const { data } = await octokit.rest.issues.listForRepo({
    owner,
    repo,
    state: "all",
    sort: "created",
    direction: "desc",
    per_page: 100,
  });

  return data
    .filter((issue) => !issue.pull_request)
    .map((issue) => mapIssueToTask(issue, repo));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapIssueToTask(issue: any, repo: string): Task {
  return {
    id: issue.id,
    title: issue.title,
    description: issue.body || "",
    labels:
      issue.labels?.map((l: { name?: string }) =>
        typeof l === "string" ? l : l.name || ""
      ) || [],
    state: issue.state as "open" | "closed",
    issueNumber: issue.number,
    issueUrl: issue.html_url,
    repo,
    createdAt: issue.created_at,
  };
}
