import { Book, BookData } from 'gede-book-api'
import PQueue from 'p-queue'
import { BookCatalogRepository, BookCategoryRepository, BookContentRepository, BookRepository } from './dataSource.js'
import { BookCatalog, BookCategory, Book as BookEntity } from './entity/book.js'

export async function saveBookCategory() {
    const taskName = '获取图书分类列表'
    const taskName2 = '保存图书分类列表'

    console.log(`[${taskName}] 开始`)
    const queue = new PQueue({ concurrency: 10 })
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
    const queue = new PQueue({ concurrency: 10 })
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
    const queue = new PQueue({ concurrency: 10 })
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

async function saveBookCatalog(book: BookEntity, catalogs: BookData['catalogs'], parentCatlog?: BookCatalog) {
    const queue = new PQueue({ concurrency: 10 })
    catalogs.forEach((catalog, index) => {
        queue.add(async () => {
            const result = await BookCatalogRepository.insert({
                page: catalog.page,
                title: catalog.title,
                index,
                parent: { id: parentCatlog?.id },
                book: { id: book.id }
            })
            if (catalog.children?.length > 0) {
                await saveBookCatalog(book, catalog.children, result.identifiers[0] as BookCatalog)
            }
        })
    })
    await queue.onIdle()
}

async function saveBookContent(book: BookEntity, contents: BookData['contents']) {
    const queue = new PQueue({ concurrency: 10 })
    contents.forEach((content, index) => {
        queue.add(async () => {
            await BookContentRepository.insert({
                index,
                content,
                book: { id: book.id }
            })
        })
    })
    await queue.onIdle()
}

async function saveBookDataByBook(book: BookEntity) {
    const taskName = '获取图书的目录和正文'
    const taskName2 = '保存图书目录'
    const taskName3 = '保存图书正文'

    console.log(`[${taskName}] 开始 [${book.chaoxingId}]`)
    const data = await Book.getData(book.chaoxingId, 0, 10000)
    console.log(`[${taskName}] 结束 [${book.chaoxingId}]`)

    console.log(`[${taskName2}] 开始 [${book.chaoxingId}] [${data.catalogs.length}]`)
    await saveBookCatalog(book, data.catalogs)
    console.log(`[${taskName2}] 结束 [${book.chaoxingId}] [${data.catalogs.length}]`)

    console.log(`[${taskName3}] 开始 [${book.chaoxingId}] [${data.contents.length}]`)
    await saveBookContent(book, data.contents)
    console.log(`[${taskName3}] 开始 [${book.chaoxingId}] [${data.contents.length}]`)
}

export async function saveBookData(books?: BookEntity[]) {
    const taskName = '保存图书的目录和正文'
    let finished = 0

    console.log(`[${taskName}] 开始`)
    const errorList: { book: BookEntity, message: string }[] = []
    const queue = new PQueue({ concurrency: 10 })
    if (!books) books = await BookRepository.find()
    books.forEach(book => {
        queue.add(async () => {
            try {
                await saveBookDataByBook(book)
            } catch (error) {
                if (error instanceof Error) {
                    console.log(`[${taskName}] 出错 [${book.id}] [${error.message}]`)
                    errorList.push({ book, message: error.message })
                }
            } finally {
                console.log((finished++ / books.length * 100).toFixed(2))
            }
        })
    })
    await queue.onIdle()
    console.log(`[${taskName}] 结束`)
    return errorList
}