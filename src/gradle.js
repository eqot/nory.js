import fs from 'fs'

const DEFAULT_FILE = './app/build.gradle'

export default class Gradle {
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
