import axios, { AxiosError } from 'axios';
import { config } from '../../config';

export interface GitHubRepoMetadata {
  url: string;
  owner: string;
  name: string;
  fullName: string;
  description: string | null;
  defaultBranch: string;
  visibility: string;
  primaryLanguage: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  lastUpdatedAt: string | null;
}

export interface GitHubFile {
  path: string;
  type: 'blob' | 'tree';
  size?: number;
}

export interface GitHubRepoData {
  metadata: GitHubRepoMetadata;
  languages: Record<string, number>;
  fileTree: GitHubFile[];
}

/**
 * Normalizes and parses a GitHub URL to extract owner and repository name.
 * Accepts formats:
 * - https://github.com/owner/repository
 * - https://github.com/owner/repository.git
 * - github.com/owner/repository
 * - github.com/owner/repository/tree/main (strips suffix)
 */
export function parseGitHubUrl(url: string): { owner: string; name: string } {
  if (!url) {
    throw new Error('GitHub repository URL is required.');
  }

  // Clean white spaces
  let cleaned = url.trim();

  // Ensure it references github.com
  if (!cleaned.includes('github.com')) {
    throw new Error('Invalid URL: Only GitHub repositories are supported.');
  }

  // Remove protocol and www
  cleaned = cleaned.replace(/^(https?:\/\/)?(www\.)?/, '');

  // Split path components
  const parts = cleaned.split('/');
  
  // parts[0] should be github.com
  if (parts[0] !== 'github.com' || parts.length < 3) {
    throw new Error('Invalid GitHub repository URL format.');
  }

  const owner = parts[1];
  let name = parts[2];

  // Strip .git ending
  if (name.endsWith('.git')) {
    name = name.slice(0, -4);
  }

  if (!owner || !name) {
    throw new Error('Could not parse owner or repository name from URL.');
  }

  return { owner, name };
}

/**
 * Helper to get axios config with github authentication
 */
function getAxiosConfig() {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };

  if (config.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${config.GITHUB_TOKEN}`;
  }

  return {
    headers,
    timeout: 10000, // 10 second timeout
  };
}

/**
 * Fetches repository data: metadata, languages, and recursive file tree.
 */
export async function fetchGitHubRepository(url: string): Promise<GitHubRepoData> {
  const { owner, name } = parseGitHubUrl(url);
  const axiosConfig = getAxiosConfig();
  const apiBase = `https://api.github.com/repos/${owner}/${name}`;

  try {
    // 1. Fetch main repository metadata
    const repoResponse = await axios.get(apiBase, axiosConfig);
    const repoData = repoResponse.data;

    const metadata: GitHubRepoMetadata = {
      url: repoData.html_url,
      owner: repoData.owner.login,
      name: repoData.name,
      fullName: repoData.full_name,
      description: repoData.description || null,
      defaultBranch: repoData.default_branch || 'main',
      visibility: repoData.private ? 'private' : 'public',
      primaryLanguage: repoData.language || null,
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      openIssues: repoData.open_issues_count,
      lastUpdatedAt: repoData.updated_at || null,
    };

    if (repoData.private) {
      throw new Error('Private repositories are not supported in the initial version. Please provide a public repository URL.');
    }

    // 2. Fetch languages statistics
    let languages: Record<string, number> = {};
    try {
      const langResponse = await axios.get(`${apiBase}/languages`, axiosConfig);
      languages = langResponse.data;
    } catch (e) {
      console.warn(`Failed to fetch languages for ${owner}/${name}`, e);
    }

    // 3. Fetch file tree recursively using the default branch
    let fileTree: GitHubFile[] = [];
    try {
      const treeResponse = await axios.get(
        `${apiBase}/git/trees/${metadata.defaultBranch}?recursive=1`,
        axiosConfig
      );
      
      if (treeResponse.data && Array.isArray(treeResponse.data.tree)) {
        const rawTree = treeResponse.data.tree as any[];
        
        // Limit total files parsed to protect against massive repositories
        const maxFiles = 1000;
        const truncatedTree = rawTree.slice(0, maxFiles);

        fileTree = truncatedTree.map(item => ({
          path: item.path,
          type: item.type === 'tree' ? 'tree' : 'blob',
          size: item.size,
        }));
      }
    } catch (e) {
      // Fallback: If Git Trees API fails (e.g. empty repository), keep tree empty
      console.warn(`Failed to fetch file tree for ${owner}/${name}`, e);
    }

    return {
      metadata,
      languages,
      fileTree,
    };

  } catch (error) {
    handleGitHubError(error, `${owner}/${name}`);
  }
}

/**
 * Reads a single text file from a GitHub repository.
 * Implements guards on file size and types.
 */
export async function fetchGitHubFileContent(
  owner: string,
  repo: string,
  branch: string,
  filePath: string
): Promise<string> {
  // Guard: Skip common binary extensions
  const binaryExtensions = [
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.tar', '.gz',
    '.mp4', '.mp3', '.exe', '.dll', '.so', '.woff', '.woff2', '.ttf', '.eot'
  ];
  if (binaryExtensions.some(ext => filePath.toLowerCase().endsWith(ext))) {
    throw new Error(`File is binary and cannot be read as text: ${filePath}`);
  }

  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
  const axiosConfig = getAxiosConfig();

  try {
    // Perform a HEAD request first to check size if possible, or download with strict limit
    const response = await axios.get(rawUrl, {
      ...axiosConfig,
      maxContentLength: 102400, // 100 KB limit
      responseType: 'text',
    });

    return response.data as string;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error(`File not found: ${filePath}`);
      }
      if (error.code === 'ECONNABORTED') {
        throw new Error(`Timeout reading file: ${filePath}`);
      }
    }
    throw new Error(`Error reading file content from GitHub: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Standardized GitHub Error Handler
 */
function handleGitHubError(error: any, repoPath: string): never {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;
    const rateLimitLimit = axiosError.response?.headers['x-ratelimit-limit'];
    const rateLimitRemaining = axiosError.response?.headers['x-ratelimit-remaining'];

    if (status === 404) {
      throw new Error(`GitHub repository "${repoPath}" not found. Verify the URL is correct and the repository is public.`);
    }
    if (status === 403 && rateLimitRemaining === '0') {
      throw new Error(`GitHub API rate limit exceeded. Please try again later. Limit: ${rateLimitLimit}`);
    }
    if (status === 401) {
      throw new Error('Unauthorized access to GitHub API. The GitHub token provided may be invalid.');
    }
  }

  throw new Error(`Failed to fetch repository information: ${error instanceof Error ? error.message : 'Unknown error'}`);
}
