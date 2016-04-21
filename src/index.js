import argv from 'argv'
import Table from 'cli-table'
import colors from 'colors'

import artifact from './artifact'
import gradle from './gradle'

const DEFAULT_TABLE_STYLE = { head: ['cyan'] }

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

function searchArtifact (name) {
  artifact.find(name)
    .then(arts => {
      let table = new Table({
        head: ['groupId', 'artifactId', 'version', 'match'],
        style: DEFAULT_TABLE_STYLE
      })

      arts.forEach(art => {
        const matchFlag = (art.a === name) ? '\u2713'.green : ''
        table.push(
          [art.g, art.a, art.latestVersion, matchFlag]
        )
      })

      console.log(table.toString())
    })
}

function installArtifact (name) {
  artifact.findExactMatch(name)
    .then(gradle.injectArtifact)
    .then(art => {
      if (art) {
        let table = new Table({
          head: ['groupId', 'artifactId', 'version'],
          style: { head: ['cyan'] }
        })

        table.push([art.group, art.name, art.version])

        console.log(table.toString())
        console.log('\u2713'.green, 'Successfully installed.')
      } else {
        console.warn('\u2757 ', name + ' has been already installed.')
      }
    })
}

function checkArtifact () {
  gradle.getArtifacts()
    .then(currentArtifacts => artifact.getLatestVersion(currentArtifacts)
      .then(latestArtifacts => {
        let table = new Table({
          head: ['groupId', 'artifactId', 'current', 'latest'],
          style: DEFAULT_TABLE_STYLE
        })

        table.push(...currentArtifacts.map(art => getArtifactInfo(art, latestArtifacts)))

        console.log(table.toString())
      })
    )
}

function updateArtifact () {
  gradle.getArtifacts()
    .then(currentArtifacts => artifact.getLatestVersion(currentArtifacts)
      .then(latestArtifacts => gradle.updateArtifacts(currentArtifacts, latestArtifacts)
        .then(arts => {
          if (arts.length === 0) {
            console.log('All artifacts up to date.')
            return
          }

          let table = new Table({
            head: ['groupId', 'artifactId', 'current', 'updated'],
            style: DEFAULT_TABLE_STYLE
          })

          table.push(...arts.map(art => getArtifactInfo(art, latestArtifacts, 'green')))

          console.log(table.toString())
          console.log('\u2713'.green, 'Successfully updated.')
        })
    ))
}

function getArtifactInfo (art, latestArtifacts, color) {
  let latestVersion = latestArtifacts[art.name] ? latestArtifacts[art.name].latestVersion : ''
  if (latestVersion !== art.version) {
    latestVersion = latestVersion[color || 'red']
  }

  return [art.group, art.name, art.version, latestVersion]
}
