import { Book, BookData, Magazine } from 'gede-book-api'
import PQueue from 'p-queue'
import { Issue } from './entity/magazine.js'
import {
    AppDataSource,
    BookCategoryRepository,
    BookRepository,
    IssueRepository,
    MagazineCatalogRepository,
    MagazineCategoryRepository,
    MagazineContentRepository,
    MagazineRepository
} from './dataSource.js'
import { writeFileSync } from 'fs'

/** 将所有的书刊分类保存到数据库 */
async function saveCategories() {
    const insertQueue = new PQueue({ concurrency: 20 })
    const bookCategories = await Book.getCategories()
    bookCategories.forEach(category => {
        insertQueue.add(async () => {
            await BookCategoryRepository.insert({
                chaoxingId: category.id,
                name: category.name
            })
        })
    })
    const magazineCategories = await Magazine.getCategories()
    magazineCategories.forEach(category => {
        insertQueue.add(async () => {
            await MagazineCategoryRepository.insert({
                chaoxingId: category.id,
                name: category.name
            })
        })
    })
    await insertQueue.onIdle()
}

async function saveBookItems() {
    const categories = await BookCategoryRepository.find()
    const requestQueue = new PQueue({ concurrency: 20 })

    categories.forEach(category => {
        requestQueue.add(async () => {
            try {
                const list = await Book.getList(category.chaoxingId, 0, 10000)
                console.log(`${category.chaoxingId} 获取图书列表成功，正在写入数据库`)
                const insertQueue = new PQueue({ concurrency: 20 })
                list.forEach(item => {
                    insertQueue.add(async () => {
                        await BookRepository.insert({
                            author: item.author,
                            publish: item.publish,
                            bigCover: item.bigCover,
                            webReader: item.webReader,
                            idType: item.type,
                            isbn: item.isbn,
                            category: { id: category.id },
                            name: item.name,
                            surl: item.surl,
                            summary: item.summary,
                            cover: item.smallCover,
                            chaoxingId: item.id,
                        })
                    })
                })
                await insertQueue.onIdle()
            } catch (error) {
                if (error instanceof Error) {
                    console.error(category.chaoxingId, error.message)
                }
            }
        })
    })
    await requestQueue.onIdle()
}

async function saveMagazineItems() {
    const categories = await MagazineCategoryRepository.find({ where: { type: 'magazine' } })
    const requestQueue = new PQueue({ concurrency: 10 })
    const insertQueue = new PQueue({ concurrency: 10 })

    categories.forEach(category => {
        requestQueue.add(async () => {
            try {
                const list = await Magazine.getList(category.chaoxingId, 0, 10000)
                console.log(`${category.chaoxingId} 获取期刊列表成功，正在写入数据库`)
                list.forEach(item => {
                    insertQueue.add(async () => {
                        try {
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
                        } catch (error) {
                            if (error instanceof Error) {
                                console.error(error.message)
                                console.log(item)
                                process.exit()
                            }
                        }
                    })
                })
            } catch (error) {
                if (error instanceof Error) {
                    console.error(category.chaoxingId, error.message)
                }
            }
        })
    })
    await requestQueue.onIdle()
    await insertQueue.onIdle()
}

/** 获取期刊分期列表 */
async function saveIssues() {
    const magazines = await MagazineRepository.find()
    const requestQueue = new PQueue({ concurrency: 20 })

    magazines.forEach(magazine => {
        requestQueue.add(async () => {
            const insertQueue = new PQueue({ concurrency: 20 })
            const issues = await Magazine.getIssues(parseInt(magazine.chaoxingId))
            console.log(`${magazine.chaoxingId} 获取分期列表完成，正在写入数据库`)
            issues.forEach((issue, index) => {
                insertQueue.add(async () => {
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
            await insertQueue.onIdle()
        })
    })

    await requestQueue.onIdle()
}



const insertCatalogs = async (errorList: any[], issue: Issue, catalogs: BookData['catalogs'], parentId?: number) => {
    const insertQueue = new PQueue({ concurrency: 20 })
    catalogs.forEach(async ({ page, title, children }, index) => {
        insertQueue.add(async () => {
            try {
                const result = await MagazineCatalogRepository.insert({
                    page,
                    title,
                    index,
                    parent: { id: parentId },
                    issue: { id: issue.id }
                })
                if (children?.filter(i => i.title)?.length > 0) {
                    insertCatalogs(errorList, issue, children, result.identifiers[0].id)
                }
            } catch (error) {
                console.log({ page, title, children })
                console.log(issue)
                console.log((error as Error).message)
                errorList.push(issue, { page, title, children }, index, (error as Error).message)
            }
        })
    })
    await insertQueue.onIdle()
}

async function saveMagazineContent(issues?: Issue[]) {
    if (!issues) issues = await IssueRepository.find()
    const requestQueue = new PQueue({ concurrency: 20 })

    const errorChaoxingIdList: { issue: Issue, errorMessage: string }[] = []

    let finished = 0
    const issuesActive = issues.slice(20000, 30000)
    issuesActive.forEach(issue => {
        requestQueue.add(async () => {
            try {
                const data = await Magazine.getData(issue.surl, issue.issueId, 0, 10000)
                console.log(`${issue.issueId} 获取目录和内容成功，正在写入数据库`)
                insertCatalogs(errorChaoxingIdList, issue, data.catalogs)
                const insertQueue = new PQueue({ concurrency: 10 })
                data.contents.forEach((content, index) => {
                    insertQueue.add(async () => {
                        await MagazineContentRepository.insert({
                            index, content, issue: { id: issue.id }
                        })
                    })
                })
                await insertQueue.onIdle()
                console.log((++finished / issuesActive.length * 100).toFixed(2), finished, issuesActive.length)
            } catch (error) {
                if (error instanceof Error) {
                    console.log((++finished / issuesActive.length * 100).toFixed(2), 'error')
                    errorChaoxingIdList.push({ issue, errorMessage: error.message })
                }
            }
        })
    })

    await requestQueue.onIdle()

    writeFileSync('errorList_20000-30000.json', JSON.stringify(errorChaoxingIdList))
}

await AppDataSource.initialize()

// console.log('正在获取分类列表')
// await saveCategories()
// console.log('正在获取图书列表')
// await saveBookItems()
// console.log('正在获取期刊列表')
// await saveMagazineItems()
// console.log('正在获取期刊分期列表')
// await saveIssues()

// await saveBookContent()
// await saveMagazineContent()
// const issue =
// const data = await Magazine.getData('https://gede.5read.com/g/88837731.h', 'MZ12029966', )

// await MagazineCatalogRepository.insert({
//     page,
//     title,
//     index,
//     parent: { id: parentId },
//     issue: { id: issue.id }
// })

// const errorList = JSON.parse(readFileSync('errorChaoxingIdList5_back.json').toString()) as { id: string, message: string }[]
// const newErrorList: any[] = []
// const requestQueue = new PQueue({ concurrency: 10 })
// errorList.forEach(({ id: issueId, message }) => {
//     requestQueue.add(async () => {
//         const issue = await IssueRepository.findOne({ where: { issueId } })
//         if (!issue) {
//             newErrorList.push({ id: issueId, message })
//             return
//         }
//         requestQueue.add(async () => {
//             try {
//                 const data = await Magazine.getData(issue.surl, issue.issueId, 0, 10000)
//                 console.log(`${issue.issueId} 获取目录和内容成功，正在写入数据库`)
//                 insertCatalogs(newErrorList, issue, data.catalogs)
//                 const insertQueue = new PQueue({ concurrency: 10 })
//                 data.contents.forEach((content, index) => {
//                     insertQueue.add(async () => {
//                         await MagazineContentRepository.insert({
//                             index, content, issue: { id: issue.id }
//                         })
//                     })
//                 })
//                 await insertQueue.onIdle()
//             } catch (error) {
//                 if (error instanceof Error) {
//                     newErrorList.push({ id: issue.issueId, message: error.message })
//                 }
//             }
//         })
//     })
// })

// await requestQueue.onIdle()
// writeFileSync('errorChaoxingIdList6.json', JSON.stringify(newErrorList))

// const books = (JSON.parse(readFileSync('errorList_back.json').toString()) as { book: BookEntity }[]).map(i => i.book)
// await saveBookContent(books)

// await saveMagazineContent()

await AppDataSource.destroy()