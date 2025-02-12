import { Book } from 'gede-book-api'
import PQueue from 'p-queue'
import { BookCategoryRepository, BookRepository } from './dataSource.js'
import { BookCategory } from './entity/book.js'

export async function saveBookCategory() {
    const taskName = '获取图书分类列表'
    const taskName2 = '保存图书分类列表'
    console.log(`[${taskName}] 开始`)
    const queue = new PQueue({ concurrency: 20 })
    const bookCategories = await Book.getCategories()
    console.log(`[${taskName}] 结束`)
    console.log(`[${taskName2}] 开始`)
    bookCategories.forEach(category => {
        queue.add(async () => {
            await BookCategoryRepository.insert({
                chaoxingId: category.id,
                name: category.name
            })
        })
    })
    await queue.onIdle()
    console.log(`[${taskName2}] 结束`)
}

async function saveBookByCategory(category: BookCategory) {
    const taskName = '获取指定分类的图书列表'
    const taskName2 = '保存指定分类的图书列表'
    console.log(`[${taskName}] 开始 [${category.chaoxingId}]`)
    const queue = new PQueue({ concurrency: 20 })
    const list = await Book.getList(category.chaoxingId, 0, 10000)
    console.log(`[${taskName}] 结束 [${category.chaoxingId}]`)
    console.log(`[${taskName2}] 开始 [${list.length}]`)
    list.forEach(item => {
        queue.add(async () => {
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
    await queue.onIdle()
    console.log(`[${taskName2}] 结束 [${list.length}]`)
}

export async function saveBook() {
    const taskName = '保存图书列表'
    console.log(`[${taskName}] 开始`)
    const categories = await BookCategoryRepository.find()
    const queue = new PQueue({ concurrency: 20 })
    categories.forEach(category => {
        queue.add(async () => {
            try {
                await saveBookByCategory(category)
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