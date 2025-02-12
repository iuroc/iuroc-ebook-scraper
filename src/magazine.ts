import { BookData, Magazine } from 'gede-book-api'
import PQueue from 'p-queue'
import { IssueRepository, MagazineCatalogRepository, MagazineCategoryRepository, MagazineContentRepository, MagazineRepository } from './dataSource.js'
import { Issue, MagazineCatalog, MagazineCategory, Magazine as MagazineEntity } from './entity/magazine.js'

export async function saveMagazineCategory() {
    const taskName = '获取期刊分类列表'
    const taskName2 = '保存期刊分类列表'

    console.log(`[${taskName}] 开始`)
    const queue = new PQueue({ concurrency: 20 })
    const magazineCategories = await Magazine.getCategories()
    console.log(`[${taskName}] 结束`)

    console.log(`[${taskName2}] 开始`)
    magazineCategories.forEach(category => {
        queue.add(async () => {
            await MagazineCategoryRepository.insert({
                chaoxingId: category.id,
                name: category.name
            })
        })
    })
    await queue.onIdle()
    console.log(`[${taskName2}] 结束`)
}

export async function saveMagazineByCategory(category: MagazineCategory) {
    const taskName = '获取指定分类的期刊列表'
    const taskName2 = '保存指定分类的期刊列表'

    console.log(`[${taskName}] 开始 [${category.chaoxingId}]`)
    const queue = new PQueue({ concurrency: 20 })
    const list = await Magazine.getList(category.chaoxingId, 0, 10000)
    console.log(`[${taskName}] 结束 [${category.chaoxingId}]`)

    console.log(`[${taskName2}] 开始 [${list.length}]`)
    list.forEach(item => {
        queue.add(async () => {
            await MagazineRepository.insert({
                cn: item.cn,
                issn: item.issn,
                category: { id: category.id },
                name: item.name,
                surl: item.surl,
                summary: item.summary,
                cover: item.cover,
                chaoxingId: item.id.toString(),
            })
        })
    })
    await queue.onIdle()
    console.log(`[${taskName2}] 结束 [${list.length}]`)
}

export async function saveMagazine() {
    const taskName = '保存期刊列表'

    console.log(`[${taskName}] 开始`)
    const categories = await MagazineCategoryRepository.find()
    const queue = new PQueue({ concurrency: 20 })
    categories.forEach(category => {
        queue.add(async () => {
            await saveMagazineByCategory(category)
        })
    })
    await queue.onIdle()
    console.log(`[${taskName}] 结束`)
}

async function saveIssueByMagazine(magazine: MagazineEntity) {
    const taskName = '获取指定期刊的分期列表'
    const taskName2 = '保存指定期刊的分期列表'

    const queue = new PQueue({ concurrency: 20 })
    console.log(`[${taskName}] 开始 [${magazine.id}]`)
    const issues = await Magazine.getIssues(parseInt(magazine.chaoxingId))
    console.log(`[${taskName}] 结束 [${magazine.id}]`)

    console.log(`[${taskName2}] 开始 [${issues.length}]`)
    issues.forEach((issue, index) => {
        queue.add(async () => {
            await IssueRepository.insert({
                issueId: issue.issueId,
                name: issue.name,
                cover: issue.cover,
                surl: issue.surl,
                webReader: issue.webReader,
                magazine: { id: magazine.id },
                index
            })
        })
    })
    await queue.onIdle()
    console.log(`[${taskName2}] 结束 [${issues.length}]`)
}

export async function saveIssue() {
    const taskName = '获取期刊分期列表'

    console.log(`[${taskName}] 开始`)
    const queue = new PQueue({ concurrency: 20 })
    const magazines = await MagazineRepository.find()
    magazines.forEach(magazine => {
        queue.add(async () => {
            try {
                await saveIssueByMagazine(magazine)
            } catch (error) {
                if (error instanceof Error && error.message != '没有获取到数据') {
                    throw error
                }
            }
        })
    })
    await queue.onIdle()
    console.log(`[${taskName}] 结束`)
}

async function saveMagazineCatalog(issue: Issue, catalogs: BookData['catalogs'], parentCatlog?: MagazineCatalog) {
    const queue = new PQueue({ concurrency: 20 })
    catalogs.forEach((catalog, index) => {
        queue.add(async () => {
            const result = await MagazineCatalogRepository.insert({
                page: catalog.page,
                title: catalog.title,
                index,
                parent: { id: parentCatlog?.id },
                issue: { id: issue.id }
            })
            if (catalog.children?.length > 0) {
                await saveMagazineCatalog(issue, catalog.children, result.identifiers[0] as MagazineCatalog)
            }
        })
    })
    await queue.onIdle()
}

async function saveeMagazineContent(issue: Issue, contents: BookData['contents']) {
    const queue = new PQueue({ concurrency: 20 })
    contents.forEach((content, index) => {
        queue.add(async () => {
            await MagazineContentRepository.insert({
                index,
                content,
                issue: { id: issue.id }
            })
        })
    })
    await queue.onIdle()
}

async function saveMagazineDataByIssue(issue: Issue) {
    const taskName = '获取期刊分期的目录和正文'
    const taskName2 = '保存期刊分期目录'
    const taskName3 = '保存期刊分期正文'

    console.log(`[${taskName}] 开始 [${issue.issueId}]`)
    const data = await Magazine.getData(issue.surl, issue.issueId, 0, 10000)
    console.log(`[${taskName}] 结束 [${issue.issueId}]`)

    console.log(`[${taskName2}] 开始 [${issue.issueId}] [${data.catalogs.length}]`)
    await saveMagazineCatalog(issue, data.catalogs)
    console.log(`[${taskName2}] 结束 [${issue.issueId}] [${data.catalogs.length}]`)

    console.log(`[${taskName3}] 开始 [${issue.issueId}] [${data.contents.length}]`)
    await saveeMagazineContent(issue, data.contents)
    console.log(`[${taskName3}] 开始 [${issue.issueId}] [${data.contents.length}]`)
}

export async function saveMagazineData(issues?: Issue[]) {
    const taskName = '保存期刊分期的目录和正文'

    console.log(`[${taskName}] 开始`)
    const errorList: { issue: Issue, message: string }[] = []
    const queue = new PQueue({ concurrency: 10 })
    if (!issues) issues = await IssueRepository.find()
    issues.forEach(issue => {
        queue.add(async () => {
            try {
                await saveMagazineDataByIssue(issue)
            } catch (error) {
                if (error instanceof Error) {
                    console.log(`[${taskName}] 出错 [${issue.issueId}] [${error.message}]`)
                    errorList.push({ issue, message: error.message })
                }
            }
        })
    })
    await queue.onIdle()
    console.log(`[${taskName}] 结束`)
    return errorList
}