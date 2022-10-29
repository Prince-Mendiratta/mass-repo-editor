const fs = require('fs')
var array = fs.readFileSync('repos.txt').toString().split("\n");

function extractGitHubRepoPath(url) {
    if (!url) return null;
    const match = url.match(
      /^https?:\/\/(www\.)?github.com\/(?<owner>[\w.-]+)\/(?<name>[\w.-]+)/
    );
    if (!match || !(match.groups?.owner && match.groups?.name)) return null;
    return `${match.groups.owner}/${match.groups.name}`;
  }

for(i in array) {
    console.log(extractGitHubRepoPath(array[i]))
    // console.log(array[i]);
}