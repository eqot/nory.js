import fs from 'fs'

const DEFAULT_FILE = './app/build.gradle'

export default class Gradle {
  static injectArtifactory (artifactory) {
    Gradle.load(DEFAULT_FILE)
      .then(content => content.split('\n'))
      .then(lines => {
        const injection = '    compile \'' + artifactory + '\''

        let output = []
        let state = 'before'
        let isAlreadyInstalled = false
        lines.forEach(line => {
          if (state === 'before') {
            if (line === 'dependencies {') {
              state = 'in'
            }
          } else if (state === 'in') {
            if (line === injection) {
              isAlreadyInstalled = true
            } else if (line === '}') {
              if (!isAlreadyInstalled) {
                output.push(injection)
              }

              state = 'after'
            }
          }

          output.push(line)
        })

        if (!isAlreadyInstalled) {
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
