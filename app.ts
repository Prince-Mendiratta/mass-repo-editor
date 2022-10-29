import * as dotenv from 'dotenv';
import { Octokit } from '@octokit/rest' 
dotenv.config()

var client = new Octokit({
    auth: process.env.AUTH_TOKEN
});

async function forkRepo(url: string){
    let repoDetails: Array<string> = extractGitHubRepoPath(url)
    let res = await client.rest.repos.createFork({
        owner: repoDetails[0],
        repo: repoDetails[1],
        default_branch_only: true
    })
    return res;
    // client.fork()
}

function extractGitHubRepoPath(url: string): Array<string> {
    const match = url.match(
        /^https?:\/\/(www\.)?github.com\/(?<owner>[\w.-]+)\/(?<name>[\w.-]+)/
    );
    if (!match || !(match.groups?.owner && match.groups?.name)) return [];
    return [match.groups.owner, match.groups.name]
}

(async () => {
    let res = forkRepo('https://github.com/freeCodeCamp/boilerplate-npm')
    console.log(res);
})()