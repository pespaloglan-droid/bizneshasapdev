'use strict';

const { version, build } = require('../package.json');

async function validateRelease({ repository, tag, token, request = fetch }) {
  const expectedRepository = `${build.publish.owner}/${build.publish.repo}`;
  if (repository !== expectedRepository) throw new Error('Release deposu güncelleme sağlayıcısıyla eşleşmiyor.');
  if (!/^v\d+\.\d+\.\d+$/.test(tag || '') || tag !== `v${version}`) {
    throw new Error('Release tag, package.json PC sürümüyle eşleşen kararlı vX.Y.Z olmalıdır.');
  }
  if (!token) throw new Error('Release işlemi için GH_TOKEN zorunludur.');
  const response = await request(`https://api.github.com/repos/${repository}/releases/tags/${encodeURIComponent(tag)}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
    signal: AbortSignal.timeout(30_000),
    redirect: 'error',
  });
  if (response.status === 200) throw new Error('Bu sürüm için release zaten var; mevcut yayın değiştirilmez.');
  if (response.status !== 404) throw new Error(`Release ön kontrolü başarısız (HTTP ${response.status}).`);
  return tag;
}

if (require.main === module) {
  validateRelease({ repository: process.env.GITHUB_REPOSITORY, tag: process.env.RELEASE_TAG, token: process.env.GH_TOKEN })
    .then(() => console.log('Release depo/tag/sürüm ve yeni yayın kontrolü geçti.'))
    .catch((error) => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { validateRelease };
