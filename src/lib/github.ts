import { Octokit } from "octokit";
import type { Task, TaskStatus, CreateTaskInput, Repo } from "@/types";

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

export async function fetchAllIssues(): Promise<Task[]> {
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
    .map((issue) => {
      const repo = parseTargetRepo(issue.body || "") || HUB_REPO;
      return mapIssueToTask(issue, repo);
    });
}

export async function startImplementation(issueNumber: number): Promise<void> {
  const octokit = getOctokit();
  const { owner } = getConfig();

  await octokit.rest.issues.addLabels({
    owner,
    repo: HUB_REPO,
    issue_number: issueNumber,
    labels: ["ai-implement"],
  });
}

function parseTargetRepo(body: string): string | null {
  const match = body.match(/<!-- target-repo: (\S+) -->/);
  return match ? match[1] : null;
}

function parseCost(body: string): number | null {
  const match = body.match(/<!-- api-cost: ([\d.]+) -->/);
  return match ? parseFloat(match[1]) : null;
}

function deriveStatus(state: string, labels: string[]): TaskStatus {
  if (state === "closed") return "done";
  if (labels.includes("status:failed")) return "failed";
  if (labels.includes("status:review")) return "review";
  if (labels.includes("status:in-progress")) return "in_progress";
  return "queued";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapIssueToTask(issue: any, repo: string): Task {
  const body = issue.body || "";
  const title = issue.title || "";

  const cleanBody = body
    .replace(/<!-- target-repo: \S+ -->\n?\n?/, "")
    .replace(/<!-- api-cost: [\d.]+ -->\n?/, "")
    .trim();
  const cleanTitle = title.replace(/^\[\S+\]\s*/, "");

  const labelNames: string[] =
    issue.labels?.map((l: { name?: string }) =>
      typeof l === "string" ? l : l.name || ""
    ) || [];

  return {
    id: issue.id,
    title: cleanTitle,
    description: cleanBody,
    labels: labelNames.filter(
      (l) => !l.startsWith("status:") && l !== "ai-task" && l !== "ai-implement"
    ),
    state: issue.state as "open" | "closed",
    status: deriveStatus(issue.state, labelNames),
    cost: parseCost(body),
    issueNumber: issue.number,
    issueUrl: issue.html_url,
    repo,
    createdAt: issue.created_at,
  };
}
