import fs from 'fs'

const DEFAULT_FILE = './app/build.gradle'

export default class Gradle {
  static getArtifactory () {
    return new Promise((resolve, reject) => {
      let arts = []
      Gradle.parseFileForDependencies(art => {
        arts.push(art)
      }).then(() => {
        resolve(arts)
      })
    })
  }

  static parseFile (callback) {
    return Gradle.load(DEFAULT_FILE)
      .then(content => content.split('\n'))
      .then(lines => lines.forEach(callback))
  }

  static parseFileForDependencies (callback) {
    let isInside = false
    return Gradle.parseFile(line => {
      if (!isInside) {
        if (line === 'dependencies {') {
          isInside = true
        }
      } else {
        if (line.match(/^\s*compile\s+'(.+):(.+):(.+)'\s*$/)) {
          callback({
            group: RegExp.$1,
            name: RegExp.$2,
            version: RegExp.$3
          })
        } else if (line === '}') {
          isInside = false
        }
      }
    })
  }

  static injectArtifactory (artifactory) {
    Gradle.load(DEFAULT_FILE)
      .then(content => content.split('\n'))
      .then(lines => {
        const injection = '    compile \'' + artifactory + '\''

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
              }

              isInside = false
            }
          }

          output.push(line)
        })

        if (!isInstalled) {
          fs.writeFile(DEFAULT_FILE, output.join('\n'))
          console.log(artifactory + ' has been successfully installed.')
        } else {
          console.warn(artifactory + ' has been already installed.')
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
