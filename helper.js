const times = require('time-ago')
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
})

/**
 * 
 * @param {String} text any text to display before getting user input
 * @returns {Promise} result of user input
 */
module.exports.getInputAsync = function getInput(text) {
    return new Promise((resolve, reject) => {
        readline.question(`${text}`, value => {
            resolve(value)
        })
    })
}

/**
 * We have bellow statuses in lastBuild in branch object
 * 
 * status
 * notStarted, inProgress, completed
 * 
 * result
 * undefined, failed, succeeded, canceled
 * 
 * @param {Object} lastBuild branch last build object
 * @returns {String} result of status character
 */
module.exports.getStatusChar = function getStatusChar(lastBuild) {
    if (lastBuild) {
        const { status, result } = lastBuild
        if (status === 'notStarted') return '🕔 '
        if (status === 'inProgress') return '⏳ '
        if (status === 'completed' && result === 'succeeded') return '✅ '
        if (status === 'completed' && result === 'failed') return '❌ '
        if (status === 'completed' && result === 'canceled') return '⛔️ '
    }
    return ''
}

/**
 * 
 * @param {Object} lastBuild 
 * @returns {String} result of times ago
 */
module.exports.timeAgo = function timeAgo(lastBuild) {
    if (lastBuild && lastBuild.finishTime) {
        const oldTime = new Date(lastBuild.finishTime)
        return times.ago(oldTime)
    }
    return '-'
}