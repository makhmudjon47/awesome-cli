const { getInputAsync, getStatusChar, timeAgo } = require('./helper')
const { getApps, getUser, getBranches, buildApp } = require('./services')

async function selectApp() {
    const [data, user] = await Promise.all([getApps(), getUser()])
    const apps = data.map(item => ({
        "Name": item.display_name,
        "OS": item.os,
        "Release type": item.release_type,
        "Owner": item.owner.display_name
    }))
    console.log('\n', `Hello, ${user.display_name}`)
    console.table(apps)
    let index;
    while (typeof index !== 'number') {
        const input = await getInputAsync('Please choose any app index: ')
        index = input < apps.length && Number.parseInt(input)
    }
    return data[index]
}

async function selectBranch(app) {
    const { name, owner } = app
    const data = await getBranches(owner.name, name)
    const branches = data.map(({ lastBuild, trigger, branch }) => ({
        "Name": `${getStatusChar(lastBuild)}${branch.name}`,
        "Last commit": branch.commit?.sha?.slice(0, 7),
        "Trigger": trigger || 'on push',
        "Last build": timeAgo(lastBuild)
    }))
    console.table(branches)
    let index;
    while (typeof index !== 'number') {
        const input = await getInputAsync(`Please choose any branch index, (${branches.length}) for all: `)
        index = input <= branches.length && Number.parseInt(input)
    }
    const result = (index === branches.length) ? data : data[index].branch.name
    return { app: name, owner: owner.name, result }
}

async function buildAllBranches(props) {
    const builder = buildApp()
    const tasks = props.branches.map(({ branch }) => builder({ ...props, branch: branch.name }))
    const result = await Promise.allSettled(tasks)
    return result
}

export async function main() {
    try {
        const appResult = await selectApp()
        const branchResult = await selectBranch(appResult)
        if (Array.isArray(branchResult.result)) {
            await buildAllBranches({ ...branchResult, branches: branchResult.result })
        } else {
            await buildApp()({ ...branchResult, branch: branchResult.result })
        }
    } catch (error) {
        console.log("\x1b[31m", error.message)
        process.exit(1)
    }
}