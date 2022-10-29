import * as dotenv from 'dotenv';
import { Octokit } from '@octokit/core';
import shell, { exec } from 'shelljs';
import { ChildProcess } from 'child_process';
import fs from 'fs';

dotenv.config();
const USERNAME = 'Prince-Mendiratta';
const COMMIT_MESSAGE_BASE = 'fix: remove ';
const PR_DESCRIPTION =
    "Checklist:\n\n* [x]  I have read [freeCodeCamp's contribution guidelines](https://contribute.freecodecamp.org).\n* [x]  My pull request has a [descriptive title](https://contribute.freecodecamp.org/#/how-to-open-a-pull-request?id=prepare-a-good-pr-title) (**not** a vague title like `Update index.md`)\n\nAddresses: [freeCodeCamp/freeCodeCamp#48274](https://github.com/freeCodeCamp/freeCodeCamp/issues/48274)";

var client = new Octokit({
    auth: process.env.AUTH_TOKEN
});

function extractGitHubRepoPath(url: string): Array<string> {
    const match = url.match(
        /^https?:\/\/(www\.)?github.com\/(?<owner>[\w.-]+)\/(?<name>[\w.-]+)/
    );
    if (!match || !(match.groups?.owner && match.groups?.name)) return [];
    return [match.groups.owner, match.groups.name];
}

async function forkRepo(
    url: string,
    repoDetails: Array<string>
): Promise<void> {
    console.log(`[Forking] Creating fork for ${repoDetails[1]}`);
    let res = await client.request(`POST /repos/{owner}/{repo}/forks`, {
        owner: repoDetails[0],
        repo: repoDetails[1],
        default_branch_only: true
    });
    return;
}

async function cloneRepo(url: string, repoDetails) {
    console.log(`[Cloning] Cloning repo using URI - ${url}`);
    let cloner = exec(`git clone ${url}`, { async: true, silent: true });
    return new Promise(resolve => {
        cloner.on('close', code => {
            if (code) {
                if (code == 128) {
                    console.log('Already cloned, skipping cloning.');
                } else {
                    console.log('Something went wrong while cloning.');
                    process.exit(1);
                }
            }
            console.log(`[Cloning] Repo cloned successfully!`);
            resolve(1);
        });
    });
}

async function removeReplitAndCommit(repoDetails: Array<string>) {
    shell.cd(repoDetails[1]);
    console.log(`[Current Directory] changed to ${repoDetails[1]}`);
    const removeFile = (file: string) => {
        console.log(`[Removal] Removing ${file} file`);
        exec(`rm ${file}`);
        removals.push(file);
        return 1;
    };
    let { stdout, stderr, code } = exec(
        '[ -f .replit ] && echo 1 || echo 0 && [ -f replit.nix ] && echo 1 || echo 0',
        { silent: true }
    );
    stdout = stdout.replace(/(\r\n|\n|\r)/gm, '');
    let removals: Array<String> = [];
    let files: number = 0;
    Number(stdout[0]) && removeFile('.replit') && files++;
    Number(stdout[1]) && removeFile('replit.nix') && files++;

    let commitMessage: string;
    if (files > 1) {
        commitMessage =
            COMMIT_MESSAGE_BASE + `${removals[0]} and ${removals[1]} files`;
    } else {
        commitMessage = COMMIT_MESSAGE_BASE + `${removals[0]} file`;
    }

    await commitPushAndPR(repoDetails[1], commitMessage);
    return;
}

async function commitPushAndPR(repo: string, message: string) {
    console.log(`[Commit] Commiting and pushing for repo - ${repo}!`);
    let { stdout, stderr, code } = exec('git branch', { silent: true });
    let default_branch: string = stdout.replace('*', '').trim();
    let commiter = exec(
        `git add . && git commit -S -s -m "${message}" && git push origin ${default_branch}`,
        { async: true, silent: true }
    );
    return new Promise(resolve => {
        commiter.on('close', async exitCode => {
            if (exitCode) {
                // console.log(exitCode);
                console.log('Something went wrong while commiting/pushing.');
                process.exit(1);
            }
            console.log(`[Commit] Changes commited and pushed successfully!`);
            await createPR(repo, message, default_branch);
            console.log(`[Current Directory] changed to clones`);
            shell.cd('..');
            resolve(1);
        });
    })
}

async function createPR(
    repo: string,
    commitMessage: string,
    default_branch: string
) {
    console.log(
        `[PULL REQUEST] Creating PR on repo - ${repo} with branch ${default_branch}`
    );
    await client.request('POST /repos/{owner}/{repo}/pulls', {
        owner: 'freeCodeCamp',
        repo: repo,
        title: commitMessage,
        body: PR_DESCRIPTION,
        head: `${USERNAME}:${default_branch}`,
        base: default_branch
    });
}

(async () => {
    var repos = fs.readFileSync('repos.txt').toString().split('\n');
    console.log(`[New Directory] created directory for clones`);
    shell.mkdir('clones');
    for (let i in repos) {
        let url = repos[i];
        let repoDetails: Array<string> = extractGitHubRepoPath(url);
        await forkRepo(url, repoDetails);
        console.log(`[Current Directory] changed to clones`);
        shell.cd('clones');
        let sshUrl =
            'git@github.com:' + USERNAME + '/' + repoDetails[1] + '.git';
        await cloneRepo(sshUrl, repoDetails);
        await removeReplitAndCommit(repoDetails);
    }
})();
