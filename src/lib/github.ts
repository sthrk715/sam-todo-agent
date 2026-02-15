import { Octokit } from "octokit";
import type { Task, CreateTaskInput, Repo } from "@/types";

const HUB_REPO = "sam-todo-agent";

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

  // target-repo メタデータを本文に埋め込み
  const bodyWithMeta = `<!-- target-repo: ${input.repo} -->\n\n${input.description || ""}`;

  const { data } = await octokit.rest.issues.create({
    owner,
    repo: HUB_REPO,
    title: `[${input.repo}] ${input.title}`,
    body: bodyWithMeta,
    labels,
  });

  return mapIssueToTask(data, input.repo);
}

export async function fetchIssues(targetRepo: string): Promise<Task[]> {
  const octokit = getOctokit();
  const { owner } = getConfig();

  const { data } = await octokit.rest.issues.listForRepo({
    owner,
    repo: HUB_REPO,
    state: "all",
    sort: "created",
    direction: "desc",
    per_page: 100,
  });

  return data
    .filter((issue) => !issue.pull_request)
    .filter((issue) => {
      const repo = parseTargetRepo(issue.body || "");
      // メタデータがない古いIssueはsam-todo-agent向けとみなす
      return (repo || HUB_REPO) === targetRepo;
    })
    .map((issue) => mapIssueToTask(issue, targetRepo));
}

function parseTargetRepo(body: string): string | null {
  const match = body.match(/<!-- target-repo: (\S+) -->/);
  return match ? match[1] : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapIssueToTask(issue: any, repo: string): Task {
  const body = issue.body || "";
  const title = issue.title || "";

  // メタデータとリポジトリプレフィックスを除去して表示用にクリーンアップ
  const cleanBody = body.replace(/<!-- target-repo: \S+ -->\n?\n?/, "").trim();
  const cleanTitle = title.replace(/^\[\S+\]\s*/, "");

  return {
    id: issue.id,
    title: cleanTitle,
    description: cleanBody,
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
