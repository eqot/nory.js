import fs from 'fs'
import Table from 'cli-table'
import colors from 'colors'

const DEFAULT_FILE = './app/build.gradle'

export default class Gradle {
  static getArtifacts () {
    return new Promise((resolve, reject) => {
      let arts = []
      Gradle.parseFileForDependencies(art => {
        arts.push(art)
      }).then(() => {
        resolve(arts)
      })
    })
  }

  static compareArtifacts (current, latest) {
    let table = new Table({
      head: ['groupId', 'artifactId', 'current', 'latest'],
      style: { head: ['cyan'] }
    })

    let foundUpdate = false
    current.forEach(art => {
      let latestVersion = ''
      if (latest[art.name]) {
        latestVersion = latest[art.name].latestVersion

        if (latestVersion !== art.version) {
          latestVersion = latestVersion.red

          foundUpdate = true
        }
      }

      table.push(
        [art.group, art.name, art.version, latestVersion]
      )
    })

    console.log(table.toString())

    if (!foundUpdate) {
      console.log('All artifacts up to date.')
    }
  }

  static updateArtifacts (current, latest) {
    let table = new Table({
      head: ['groupId', 'artifactId', 'current', 'updated'],
      style: { head: ['cyan'] }
    })

    let output = []
    let foundUpdate = false
    Gradle.parseFileForDependencies(art => {
      const version = latest[art.name] ? latest[art.name].latestVersion : art.version
      output.push('    compile \'' + art.group + ':' + art.name + ':' + version + '\'')

      let latestVersion = ''
      if (latest[art.name]) {
        latestVersion = latest[art.name].latestVersion

        if (latestVersion !== art.version) {
          foundUpdate = true

          latestVersion = latestVersion.green
          table.push(
            [art.group, art.name, art.version, latestVersion]
          )
        }
      }
    }, line => {
      output.push(line)
    }).then(() => {
      if (foundUpdate) {
        fs.writeFile(DEFAULT_FILE, output.join('\n'))

        console.log(table.toString())
        console.log('\u2713'.green, 'Successfully updated.')
      } else {
        console.log('All artifacts up to date.')
      }
    })
  }

  static parseFile (callback) {
    return Gradle.load(DEFAULT_FILE)
      .then(content => content.split('\n'))
      .then(lines => lines.forEach(callback))
  }

  static parseFileForDependencies (callback, callbackOutside) {
    let isInside = false
    return Gradle.parseFile(line => {
      let isCalled = false
      if (!isInside) {
        if (line.match(/^\s*dependencies\s*{$/)) {
          isInside = true
        }
      } else {
        if (line.match(/^\s*compile\s+'(.+):(.+):(.+)'\s*$/)) {
          if (callback) {
            callback({
              group: RegExp.$1,
              name: RegExp.$2,
              version: RegExp.$3
            })
          }

          isCalled = true
        } else if (line.match(/^\s*}\s*$/)) {
          isInside = false
        }
      }

      if (!isCalled && callbackOutside) {
        callbackOutside(line)
      }
    })
  }

  static injectArtifact (art) {
    Gradle.load(DEFAULT_FILE)
      .then(content => content.split('\n'))
      .then(lines => {
        let table = new Table({
          head: ['groupId', 'artifactId', 'version'],
          style: { head: ['cyan'] }
        })

        const injection = '    compile \'' + art.g + ':' + art.a + ':' + art.latestVersion + '\''

        let output = []
        let isInside = false
        let isInstalled = false
        lines.forEach(line => {
          if (!isInside) {
            if (line === 'dependencies {') {
              isInside = true
            }
          } else {
            if (line === injection) {
              isInstalled = true
            } else if (line === '}') {
              if (!isInstalled) {
                output.push(injection)

                table.push(
                  [art.g, art.a, art.latestVersion]
                )
              }

              isInside = false
            }
          }

          output.push(line)
        })

        if (!isInstalled) {
          fs.writeFile(DEFAULT_FILE, output.join('\n'))

          console.log(table.toString())
          console.log('\u2713'.green, 'Successfully installed.')
        } else {
          console.warn('\u2757 ', art.a + ' has been already installed.')
        }
      })
  }

  static load (filename) {
    return new Promise((resolve, reject) => {
      fs.readFile(filename, 'utf8', (error, content) => {
        if (!error) {
          resolve(content)
        } else {
          reject()
        }
      })
    })
  }
}
