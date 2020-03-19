var MAXINT = 9223372036854775807
var speedSuffixes = ['B', 'KB', 'MB', 'GB', 'TB']

var util = {
  humanSpeed: function (speed, fp) {
    fp = fp === undefined ? 2 : fp
    if (speed >= MAXINT) {
      return 'UNL.'
    }
    for (var suf of speedSuffixes) {
      if (speed <= 1000) {
        return (speed.toFixed(fp) + '').replace(/\.0+$/, '') + ' ' + suf + '/s'
      }
      speed /= 1024
    }
    return speed.toFixed(fp) + ' TB/s'
  }
}

export default util
