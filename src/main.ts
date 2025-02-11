import { Book, Magazine } from 'gede-book-api'
import PQueue from 'p-queue'
import { AppDataSource, BookCategoryRepository, BookRepository, MagazineCategoryRepository, MagazineRepository } from './dataSource.js'

await AppDataSource.initialize()

/** 将所有的书刊分类保存到数据库 */
async function saveCategories() {
    const insertQueue = new PQueue({ concurrency: 10 })
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
    const requestQueue = new PQueue({ concurrency: 10 })

    categories.forEach(category => {
        requestQueue.add(async () => {
            try {
                const list = await Book.getList(category.chaoxingId, 0, 10000)
                console.log(`${category.chaoxingId} 获取图书列表成功，正在写入数据库`)
                const insertQueue = new PQueue({ concurrency: 10 })
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
    const requestQueue = new PQueue({ concurrency: 10 })

    console.log(await Magazine.getIssues(1241))
}

// console.log('正在获取分类列表')
// await saveCategories()
// console.log('正在获取图书列表')
// await saveBookItems()
// console.log('正在获取期刊列表')
// await saveMagazineItems()

await saveIssues()

await AppDataSource.destroy()