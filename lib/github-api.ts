// GitHub API integration for MujeebProAI file operations
// This allows the admin to make changes via chat

const GITHUB_OWNER = "mujeebpro123"
const GITHUB_REPO = "mujeebproai"
const GITHUB_BRANCH = "main"

interface GitHubFile {
  name: string
  path: string
  sha: string
  size: number
  type: "file" | "dir"
  content?: string
}

interface GitHubError {
  message: string
  documentation_url?: string
}

// Get GitHub token from environment
function getGitHubToken(): string {
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    throw new Error("GITHUB_TOKEN environment variable is not set")
  }
  return token
}

// Make authenticated GitHub API request
async function githubRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getGitHubToken()
  const url = `https://api.github.com${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json() as GitHubError
    throw new Error(`GitHub API error: ${error.message}`)
  }

  return response.json() as Promise<T>
}

// Read a file from the repository
export async function readFile(path: string): Promise<{ content: string; sha: string }> {
  const data = await githubRequest<{ content: string; sha: string; encoding: string }>(
    `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}`
  )
  
  // Decode base64 content
  const content = Buffer.from(data.content, "base64").toString("utf-8")
  return { content, sha: data.sha }
}

// Write/update a file in the repository
export async function writeFile(
  path: string,
  content: string,
  commitMessage: string
): Promise<{ success: boolean; sha: string }> {
  // Check if file exists to get SHA for update
  let sha: string | undefined
  try {
    const existing = await readFile(path)
    sha = existing.sha
  } catch {
    // File doesn't exist, will create new
  }

  const body: Record<string, string> = {
    message: commitMessage,
    content: Buffer.from(content).toString("base64"),
    branch: GITHUB_BRANCH,
  }

  if (sha) {
    body.sha = sha
  }

  const data = await githubRequest<{ content: { sha: string } }>(
    `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
    {
      method: "PUT",
      body: JSON.stringify(body),
    }
  )

  return { success: true, sha: data.content.sha }
}

// Delete a file from the repository
export async function deleteFile(
  path: string,
  commitMessage: string
): Promise<{ success: boolean }> {
  // Get the file SHA first
  const { sha } = await readFile(path)

  await githubRequest(
    `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
    {
      method: "DELETE",
      body: JSON.stringify({
        message: commitMessage,
        sha,
        branch: GITHUB_BRANCH,
      }),
    }
  )

  return { success: true }
}

// List files in a directory
export async function listFiles(path: string = ""): Promise<GitHubFile[]> {
  const data = await githubRequest<GitHubFile[]>(
    `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}`
  )
  
  return data.map(file => ({
    name: file.name,
    path: file.path,
    sha: file.sha,
    size: file.size,
    type: file.type,
  }))
}

// Search for code in the repository
export async function searchCode(query: string): Promise<{ path: string; matches: string[] }[]> {
  const data = await githubRequest<{ items: { path: string; text_matches?: { fragment: string }[] }[] }>(
    `/search/code?q=${encodeURIComponent(query)}+repo:${GITHUB_OWNER}/${GITHUB_REPO}`
  )

  return data.items.map(item => ({
    path: item.path,
    matches: item.text_matches?.map(m => m.fragment) || [],
  }))
}

// Get repository info
export async function getRepoInfo(): Promise<{
  name: string
  fullName: string
  defaultBranch: string
  url: string
}> {
  const data = await githubRequest<{
    name: string
    full_name: string
    default_branch: string
    html_url: string
  }>(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}`)

  return {
    name: data.name,
    fullName: data.full_name,
    defaultBranch: data.default_branch,
    url: data.html_url,
  }
}

// Check if GitHub token is configured
export function isGitHubConfigured(): boolean {
  return !!process.env.GITHUB_TOKEN
}
