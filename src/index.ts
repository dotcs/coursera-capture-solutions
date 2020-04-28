import {Command, flags} from '@oclif/command'

import {capture, getCookie} from './coursera'

class CourseraCaptureSolutions extends Command {
  static description = 'Quick and dirty CLI tool to capture assignments solutions from Coursera courses.';

  static flags = {
    version: flags.version({char: 'v'}),
    help: flags.help({char: 'h'}),
    courseId: flags.string({char: 'c', name: 'courseId', description: 'Coursera Course IDs', multiple: true, required: true}),
    outputDir: flags.string({char: 'o', name: 'outputDir', description: 'Output directory', default: '/tmp/coursera-capture-solutions'}),
  }

  async run() {
    const {flags} = this.parse(CourseraCaptureSolutions)

    const cauth = process.env.CAUTH
    const courseIds = flags.courseId
    const outputDir = flags.outputDir

    if (!cauth) {
      this.error('FATAL: Environment variable CAUTH is undefined. Abort.')
    }

    const cookie = getCookie(cauth)
    capture(courseIds, cookie, outputDir)
  }
}

export = CourseraCaptureSolutions
