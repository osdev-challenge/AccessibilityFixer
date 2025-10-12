/** @type {import('semantic-release').Options} */
module.exports = {
  branches: ['main'], // main 브랜치만 릴리즈
  plugins: [
    '@semantic-release/commit-analyzer', // feat/fix/BREAKING CHANGE 해석
    '@semantic-release/release-notes-generator', // 릴리즈 노트 생성
    ['@semantic-release/changelog', { changelogFile: 'CHANGELOG.md' }],
    ['@semantic-release/npm', { npmPublish: false }], // package.json version만 갱신
    ['semantic-release-vsce', { packageVsix: true, publish: true }],
    ['@semantic-release/git', { assets: ['package.json', 'CHANGELOG.md'] }],
    ['@semantic-release/github', { assets: '*.vsix' }],
  ],
};
