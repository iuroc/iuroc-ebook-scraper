import PQueue from "p-queue"
import { BookCatalogRepository, BookContentRepository, BookRepository } from "./dataSource.js"
import { Book as BookEntity } from './entity/book.js'
import { Book, BookData } from "gede-book-api"
import { writeFileSync } from "fs"

export async function saveBookContent(books?: BookEntity[]) {
    if (!books) books = await BookRepository.find()
    const requestQueue = new PQueue({ concurrency: 20 })
    const insertCatalogs = async (book: BookEntity, catalogs: BookData['catalogs'], parentId?: number) => {
        const insertQueue = new PQueue({ concurrency: 20 })
        catalogs.forEach(async ({ page, title, children }, index) => {
            insertQueue.add(async () => {
                const result = await BookCatalogRepository.insert({
                    page,
                    title,
                    index,
                    parent: { id: parentId },
                    book: { id: book.id }
                })
                if (children?.filter(i => i.title)?.length > 0) {
                    insertCatalogs(book, children, result.identifiers[0].id)
                }
            })
        })
        await insertQueue.onIdle()
    }

    const errorList: { book: BookEntity, errorMessage: string }[] = []

    let finished = 0
    books.forEach(async book => {
        requestQueue.add(async () => {
            try {
                const data = await Book.getData(book.chaoxingId, 0, 10000)
                console.log(`${book.chaoxingId} 获取目录和内容成功，正在写入数据库`)
                await insertCatalogs(book, data.catalogs)
                const insertQueue = new PQueue({ concurrency: 10 })
                data.contents.forEach((content, index) => {
                    insertQueue.add(async () => {
                        await BookContentRepository.insert({
                            index, content, book: { id: book.id }
                        })
                    })
                })
                await insertQueue.onIdle()
                console.log((++finished / books.length * 100).toFixed(2))
            } catch (error) {
                if (error instanceof Error) {
                    errorList.push({ book, errorMessage: error.message })
                }
            }
        })
    })

    await requestQueue.onIdle()

    writeFileSync('errorList.json', JSON.stringify(errorList))
}