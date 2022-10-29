const fs = require('fs')
// var array = fs.readFileSync('repos.txt').toString().split("\n");
const shell = require('shelljs')

function extractGitHubRepoPath(url) {
    if (!url) return null;
    const match = url.match(
      /^https?:\/\/(www\.)?github.com\/(?<owner>[\w.-]+)\/(?<name>[\w.-]+)/
    );
    if (!match || !(match.groups?.owner && match.groups?.name)) return null;
    return `${match.groups.owner}/${match.groups.name}`;
  }

// for(i in array) {
//     console.log(extractGitHubRepoPath(array[i]))
//     // console.log(array[i]);
// }

// let { stdout, stderr, code } = shell.exec('[ -f aspp.ts ] && echo 1 || echo 0 && [ -f app.ts ] && echo 1 || echo 0', {silent: true})
// stdout = stdout.replace(/(\r\n|\n|\r)/gm, "");
// console.log(stdout);
// Number(stdout[0]) && console.log('ok');
// Number(stdout[1]) && console.log('not');

// let child = shell.exec('sleep 5', { async: true })
// child.on('close', (code) => {
//   console.log(code);
// })
// console.log(child.exitCode)

// let { stdout, stderr, code } = shell.exec('git branch', {silent: true})
// ok = stdout.replace('*', '').trim()
// console.log(ok);
console.log('bruh/'.slice(0, -1));