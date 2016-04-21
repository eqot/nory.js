import fs from 'fs'

export default class Gradle {
  static DEFAULT_FILE = './app/build.gradle'

  static State = {
    DEPENDENCIES_OUTSIDE: -1,
    DEPENDENCIES_START: 0,
    DEPENDENCIES_ITEM: 1,
    DEPENDENCIES_END: 2
  }

  static getArtifacts () {
    return new Promise((resolve, reject) => {
      let arts = []
      Gradle.parseFileForDependencies((line, art) => {
        if (art) {
          arts.push(art)
        }
      }).then(() => resolve(arts))
    })
  }

  static injectArtifact (art) {
    return new Promise((resolve, reject) => {
      let output = []
      let isInstalled = false
      Gradle.parseFileForDependencies((line, foundArt, state) => {
        if (state === Gradle.State.DEPENDENCIES_ITEM && foundArt && foundArt.name === art.a) {
          isInstalled = true
        }

        if (state === Gradle.State.DEPENDENCIES_END && !isInstalled) {
          output.push('    compile \'' + art.g + ':' + art.a + ':' + art.latestVersion + '\'')
        }

        output.push(line)
      }).then(() => {
        if (!isInstalled) {
          fs.writeFile(Gradle.DEFAULT_FILE, output.join('\n'))

          resolve({
            group: art.g,
            name: art.a,
            version: art.latestVersion
          })
        } else {
          resolve()
        }
      })
    })
  }

  static updateArtifacts (current, latest) {
    return new Promise((resolve, reject) => {
      let result = []
      let output = []
      Gradle.parseFileForDependencies((line, art) => {
        if (art) {
          const version = latest[art.name] ? latest[art.name].latestVersion : art.version
          output.push('    compile \'' + art.group + ':' + art.name + ':' + version + '\'')

          if (version !== art.version) {
            result.push(art)
          }
        } else {
          output.push(line)
        }
      }).then(() => {
        fs.writeFile(Gradle.DEFAULT_FILE, output.join('\n'))

        resolve(result)
      })
    })
  }

  static parseFile (callback) {
    return new Promise((resolve, reject) => {
      fs.readFile(Gradle.DEFAULT_FILE, 'utf8', (error, content) => {
        if (!error) {
          resolve(content)
        } else {
          reject()
        }
      })
    }).then(content => content.split('\n'))
      .then(lines => lines.forEach(callback))
  }

  static parseFileForDependencies (callback) {
    let isInside = false
    return Gradle.parseFile(line => {
      let state = Gradle.State.DEPENDENCIES_OUTSIDE
      let isCalled = false
      if (!isInside) {
        if (line.match(/^\s*dependencies\s*{$/)) {
          isInside = true
          state = Gradle.State.DEPENDENCIES_START
        }
      } else {
        state = Gradle.State.DEPENDENCIES_ITEM

        if (line.match(/^\s*compile\s+'(.+):(.+):(.+)'\s*$/)) {
          if (callback) {
            callback(line, {
              group: RegExp.$1,
              name: RegExp.$2,
              version: RegExp.$3
            }, state)
          }

          isCalled = true
        } else if (line.match(/^\s*}\s*$/)) {
          isInside = false

          state = Gradle.State.DEPENDENCIES_END
        }
      }

      if (!isCalled) {
        callback(line, null, state)
      }
    })
  }
}
