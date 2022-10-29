import * as dotenv from 'dotenv';
import { Octokit } from '@octokit/core'
import { createPullRequest } from 'octokit-plugin-create-pull-request';
import shell from 'shelljs'

dotenv.config();
const USERNAME = 'Prince-Mendiratta';
const COMMIT_MESSAGE_BASE = 'fix: remove '
let PR_DESCRIPTION = ''

const MyOctokit = Octokit.plugin(createPullRequest);

var client = new MyOctokit({
    auth: process.env.AUTH_TOKEN
});

function extractGitHubRepoPath(url: string): Array<string> {
    const match = url.match(
        /^https?:\/\/(www\.)?github.com\/(?<owner>[\w.-]+)\/(?<name>[\w.-]+)/
    );
    if (!match || !(match.groups?.owner && match.groups?.name)) return [];
    return [match.groups.owner, match.groups.name]
}

async function forkRepo(url: string, repoDetails: Array<string>){
    console.log(`[Forking] Creating fork for ${repoDetails[1]}`);
    let res = await client.request(`POST /repos/{owner}/{repo}/forks`, {
        owner: repoDetails[0],
        repo: repoDetails[1],
        default_branch_only: true
    })
    return res;
}

function cloneRepo(url: string){
    console.log(`[Cloning] Cloning repo using URI - ${url}`)
    let cloner = shell.exec(`git clone ${url}`, {async: true, silent: true});
    return cloner;
}

function commitAndPush(repo: string, message: string) {
    console.log(`[Commit] Commiting and pushing for repo - ${repo}!`);
    let { stdout, stderr, code } = shell.exec('git branch', {silent: true})
    let default_branch: string = stdout.replace('*', '').trim();
    shell.exec(`git add . && git commit -S -s -m "${message}" && git push origin ${default_branch}`, {silent: true})
}

function removeReplitAndCommit(repoDetails: Array<string>){
    shell.cd(repoDetails[1]);
    console.log(`[Current Directory] changed to ${repoDetails[1]}`)
    const removeFile = ((file: string) => 
    {
        console.log(`[Removal] Removing ${file} file`);
        shell.exec(`rm ${file}`);
        removals.push(file)
        return 1;
    })
    let { stdout, stderr, code } = shell.exec('[ -f .replit ] && echo 1 || echo 0 && [ -f replit.nix ] && echo 1 || echo 0', {silent: true})
    stdout = stdout.replace(/(\r\n|\n|\r)/gm, "");
    let removals: Array<String> = [];
    let files: number = 0;
    Number(stdout[0]) && removeFile('.replit') && files++;
    Number(stdout[1]) && removeFile('replit.nix') && files++

    let commitMessage: string;
    if(files > 1){
        commitMessage = COMMIT_MESSAGE_BASE + `${removals[0]} and ${removals[1]} files`;
    }else{
        commitMessage = COMMIT_MESSAGE_BASE + `${removals[0]} file`;
    }

    commitAndPush(repoDetails[1], commitMessage);
}

(async () => {
    let url = 'https://github.com/freeCodeCamp/boilerplate-npm'
    let repoDetails: Array<string> = extractGitHubRepoPath(url)
    let res = await forkRepo(url, repoDetails);
    console.log(`[New Directory] created dir for clones`)
    shell.mkdir('clones');
    console.log(`[Current Directory] changed to clones`)
    shell.cd('clones');
    let sshUrl = 'git@github.com:' + USERNAME + '/' + repoDetails[1] + '.git'
    let cloner = cloneRepo(sshUrl);
    cloner.on('close', (code) => {
        if(code){
            console.log('Something went wrong while cloning.');
            process.exit(0);
        }
        removeReplitAndCommit(repoDetails);
    })
})()