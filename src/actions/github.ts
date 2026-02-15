"use server";

import { Octokit } from "octokit";
import type { Task, TaskStatus, CreateTaskInput, Repo } from "@/types";

const HUB_REPO = "sam-todo-agent";

function getConfig() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;

  if (!token || !owner) {
    throw new Error(
      "環境変数が未設定です: GITHUB_TOKEN, GITHUB_OWNER"
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
    .filter((issue) => {
      if (issue.pull_request) return false;
      // deletedラベルが付いているissueを除外
      const labels = issue.labels?.map((l) =>
        typeof l === "string" ? l : l.name || ""
      ) || [];
      return !labels.includes("deleted");
    })
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

export async function deleteIssue(issueNumber: number): Promise<void> {
  const octokit = getOctokit();
  const { owner } = getConfig();

  // GitHub APIではissueを完全に削除できないため、クローズして削除済みラベルを追加
  await octokit.rest.issues.update({
    owner,
    repo: HUB_REPO,
    issue_number: issueNumber,
    state: "closed",
    labels: ["deleted"],
  });
}

export async function retryFailedTask(issueNumber: number): Promise<void> {
  const octokit = getOctokit();
  const { owner } = getConfig();

  // Remove failed label and reopen issue if closed
  const { data: issue } = await octokit.rest.issues.get({
    owner,
    repo: HUB_REPO,
    issue_number: issueNumber,
  });

  // Remove status labels
  const labelsToRemove = ["status:failed", "status:in-progress", "status:review"];
  for (const label of labelsToRemove) {
    try {
      await octokit.rest.issues.removeLabel({
        owner,
        repo: HUB_REPO,
        issue_number: issueNumber,
        name: label,
      });
    } catch {
      // Ignore if label doesn't exist
    }
  }

  // Reopen if closed
  if (issue.state === "closed") {
    await octokit.rest.issues.update({
      owner,
      repo: HUB_REPO,
      issue_number: issueNumber,
      state: "open",
    });
  }

  // Trigger re-implementation by adding ai-implement label
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

function parsePrUrl(body: string): string | undefined {
  const match = body.match(/<!-- pr-url: (.+?) -->/);
  return match ? match[1] : undefined;
}

function parseSummary(body: string): string | undefined {
  const match = body.match(/<!-- impl-summary: (.+?) -->/);
  return match ? match[1] : undefined;
}

function parseChangedFiles(body: string): string[] | undefined {
  const match = body.match(/<!-- impl-files: (.+?) -->/);
  return match ? match[1].split(",").filter(Boolean) : undefined;
}

function parseImplDescription(body: string): string | undefined {
  // Base64エンコードされた文字列は改行を含まないため、単純なマッチで十分
  const match = body.match(/<!-- impl-description: ([A-Za-z0-9+/=]+) -->/);
  if (!match) return undefined;
  // Base64でデコード（ワークフロー側でエンコード）
  try {
    return Buffer.from(match[1], "base64").toString("utf-8");
  } catch {
    // Base64でない場合はそのまま返す（後方互換性）
    return match[1];
  }
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
    .replace(/<!-- pr-url: .+? -->\n?/, "")
    .replace(/<!-- impl-summary: .+? -->\n?/, "")
    .replace(/<!-- impl-files: .+? -->\n?/, "")
    .replace(/<!-- impl-description: [A-Za-z0-9+/=]+ -->\n?/, "")
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
    updatedAt: issue.updated_at,
    closedAt: issue.closed_at,
    prUrl: parsePrUrl(body),
    summary: parseSummary(body),
    changedFiles: parseChangedFiles(body),
    implDescription: parseImplDescription(body),
  };
}
