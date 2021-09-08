const keys = require('./keys.json')
const axios = require('axios').create({
    baseURL: 'https://api.appcenter.ms/',
    headers: { "X-API-Token": keys["X-API-Token"] }
})

/**
 * Add interceptor so that we will not get data object every time from response
 */
axios.interceptors.response.use(function (response) {
    return response.data;
});
/**
 * Gets user details
 * @returns {Promise}
 */
module.exports.getUser = function getUser() {
    return axios.get('/v0.1/user')
}
/**
 * Gets all apps belong to the user
 * @returns {Promise}
 */
module.exports.getApps = function getApps() {
    return axios.get('/v0.1/apps')
}
/**
 * Gets all branches
 * @param {String} owner Owner name
 * @param {String} app App name
 * @returns {Promise}
 */
module.exports.getBranches = function getBranches(owner, app) {
    return axios.get(`/v0.1/apps/${owner}/${app}/branches`)
}
/**
 * Builds the app
 * @param {String} owner Owner name
 * @param {String} app App name
 * @param {String} branch Branch name
 * @returns 
 */
module.exports.buildApp = () => {
    const state = {}
    return async function ({ app, owner, branch }) {
        const buildStarted = Date.now()
        const { id } = await axios.post(`/v0.1/apps/${owner}/${app}/branches/${branch}/builds`)
        const source = setInterval(async () => {
            const data = await axios(`/v0.1/apps/${owner}/${app}/builds/${id}`)
            if (data.status === 'inProgress') {
                console.log(`⏳ Build in progress, ${branch}`)
            }
            if (data.status === 'completed') {
                const seconds = Math.abs((Date.now() - buildStarted) / 1000)
                if (data.result === 'failed') {
                    console.log("\x1b[31m", '\n', "❌ BUILD FAILED")
                    console.log("\x1b[34m", `${branch} build failed in ${seconds} seconds. Link to build logs: https://appcenter.ms/users/${owner}/apps/${app}/build/branches/${branch}/builds/${id}`)
                }
                if (data.result === 'canceled') {
                    console.log("\x1b[31m", '\n', "⛔️ BUILD CANCELED")
                    console.log("\x1b[34m", `${branch} build canceled in ${seconds} seconds. Link to build logs: https://appcenter.ms/users/${owner}/apps/${app}/build/branches/${branch}/builds/${id}`)
                }
                if (data.result === 'succeeded') {
                    console.log("\x1b[32m", '\n', "✅ BUILD SUCCESSFULLY FINISHED")
                    console.log("\x1b[34m", `${branch} build completed in ${seconds} seconds. Link to build logs: https://appcenter.ms/users/${owner}/apps/${app}/build/branches/${branch}/builds/${id}`)
                }
                console.log("\x1b[0m")
                state.stack.pop()
                clearInterval(source)
                if (state.stack.length === 0) {
                    process.exit(0)
                }
            }
        }, 1000)
        if (!state.stack) {
            state.stack = []
        }
        state.stack.push(source)
        return id;
    }
}