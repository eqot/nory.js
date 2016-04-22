import path from 'path'
import argv from 'argv'
import Table from 'cli-table'
import colors from 'colors'

import artifact from './artifact'
import gradle from './gradle'

const DEFAULT_TABLE_STYLE = { head: ['cyan'] }

const COMMAND_OPTIONS = [
  {
    name: 'file',
    short: 'f',
    type: 'path',
    description: 'Specifies file or directory for build.gradle'
  }
]

export default function execute() {
  const args = argv.option(COMMAND_OPTIONS).run()

  const [command, artName] = args.targets
  const art = artName ? artName.split(':') : []
  const [group, name] = (art.length > 1) ? art : [null, art[0]]

  let {file} = args.options
  if (file) {
    if (path.basename(file) !== gradle.DEFAULT_BASENAME) {
      file = path.resolve(file, gradle.DEFAULT_BASENAME)
    }
  } else {
    file = gradle.DEFAULT_FILE
  }

  switch (command) {
    case 's':
    case 'search':
      searchArtifact(group, name)
      break

    case 'i':
    case 'install':
      installArtifact(file, group, name)
      break

    case 'c':
    case 'check':
      checkArtifact(file)
      break

    case 'u':
    case 'update':
      updateArtifact(file)
      break
  }
}

function searchArtifact (group, name) {
  artifact.find(group, name)
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

function installArtifact (file, group, name) {
  artifact.findExactMatch(group, name)
    .then(art => {
      return gradle.injectArtifact(file, art)
    })
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

function checkArtifact (file) {
  gradle.getArtifacts(file)
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

function updateArtifact (file) {
  gradle.getArtifacts(file)
    .then(currentArtifacts => artifact.getLatestVersion(currentArtifacts)
      .then(latestArtifacts => gradle.updateArtifacts(file, currentArtifacts, latestArtifacts)
        .then(arts => {
          if (arts.length === 0) {
            console.log('All artifacts up to date.')
            return
          }

          let table = new Table({
            head: ['groupId', 'artifactId', 'current', 'updated'],
            style: DEFAULT_TABLE_STYLE
          })

          table.push(...arts.map(art => getArtifactInfo(art, latestArtifacts)))

          console.log(table.toString())
          console.log('\u2713'.green, 'Successfully updated.')
        })
    ))
}

function getArtifactInfo (art, latestArtifacts, color) {
  let latestVersion = latestArtifacts[art.name] ? latestArtifacts[art.name].latestVersion : ''
  if (latestVersion !== art.version) {
    latestVersion = latestVersion[color || 'green']
  }

  return [art.group, art.name, art.version, latestVersion]
}
