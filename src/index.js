import argv from 'argv'

import artifact from './artifact'
import gradle from './gradle'

export default function execute() {
  const args = argv.run()
  const [command, name] = args.targets
  switch (command) {
    case 's':
    case 'search':
      searchArtifact(name)
      break

    case 'i':
    case 'install':
      installArtifact(name)
      break

    case 'c':
    case 'check':
      checkArtifact()
      break

    case 'u':
    case 'update':
      updateArtifact()
      break
  }
}

function searchArtifact (keyword) {
  artifact.getInfo(keyword)
    .then(arts => {
      artifact.showSearchResult(arts, keyword)
    })
}

function installArtifact (keyword) {
  artifact.getExatcMatch(keyword)
    .then(gradle.injectArtifact)
}

function checkArtifact () {
  gradle.getArtifacts()
    .then(currentArtifacts => {
      artifact.getLatestVersion(currentArtifacts)
        .then(latestArtifacts => {
          gradle.compareArtifacts(currentArtifacts, latestArtifacts)
        })
    })
}

function updateArtifact () {
  gradle.getArtifacts()
    .then(currentArtifacts => {
      artifact.getLatestVersion(currentArtifacts)
        .then(latestArtifacts => {
          gradle.updateArtifacts(currentArtifacts, latestArtifacts)
        })
    })
}
