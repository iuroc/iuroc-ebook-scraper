import { AppDataSource, BookContentRepository, BookRepository, ContentRepository, IssueRepository, ReadItemRepository } from './dataSource.js'
import { readFileSync, writeFileSync } from 'fs'
import { saveIssue, saveMagazine, saveMagazineCategory, saveMagazineData } from './magazine.js'
import { saveBook, saveBookCategory, saveBookData } from './book.js'
import { Issue } from './entity/magazine.js'
import PQueue from 'p-queue'
import { download as downloadImage } from './image.js'

console.log('[初始化数据源] 开始')
await AppDataSource.initialize()
console.log('[初始化数据源] 结束')

/** 初步采集（先执行这个，注释后面的） */
async function firstTask() {
    await saveBookCategory()
    await saveBook()
    await saveMagazineCategory()
    await saveMagazine()
    await saveIssue()
    await saveBookData().then(errorList => {
        writeFileSync('errorList_saveBookData.json', JSON.stringify(errorList))
    })
    await saveMagazineData().then(errorList => {
        writeFileSync('errorList_saveMagazineData.json', JSON.stringify(errorList))
    })
}

/** 重试采集（后执行这个，注释前面的） */
async function retryTask() {
    const jsonStr = readFileSync('errorList_saveMagazineData.json').toString()
    const errorList = JSON.parse(jsonStr) as { issue: Issue, message: string }[]
    await saveMagazineData(errorList.map(i => i.issue)).then(errorList => {
        writeFileSync('errorList_saveMagazineData2.json', JSON.stringify(errorList))
    })
}

async function downAllImage() {
    const downloadQueue = new PQueue({ concurrency: 50 })
    const errorList: { url: string, message: string }[] = []
    let finished = 0
    const downloadDir = 'E:/其他文件/数据库备份/iuroc-ebook-images'
    const images: string[] = []

    // 图书和期刊普通封面
    // const result = await ReadItemRepository.find({ select: { cover: true } })
    // images.push(...result.map(item => item.cover))

    // 图书大封面
    // const result2 = await BookRepository.find({ select: { bigCover: true } })
    // images.push(...result2.map(item => item.bigCover))

    // 期刊分期封面
    // const result3 = await IssueRepository.find({ select: { cover: true } })
    // images.push(...result3.map(item => item.cover))

    // 正文插图（请先设置 $env:NODE_OPTIONS="--max-old-space-size=25192"）
    // await pushImagesInContents(images)
    // const contents = await ContentRepository.find({ select: { content: true } })
    // contents.forEach(content => {
    //     content.content.matchAll(/<img[^>]*\s+src=["']([^"']+)["']/g).forEach(result => {
    //         images.push(result[1])
    //     })
    // })

    // 重试下载
    // const list = JSON.parse(readFileSync('errorList_downAllImage').toString()) as { url: string, message: string }[]
    // images.push(...list.map(i => i.url))

    images.forEach(url => {
        downloadQueue.add(async () => {
            try {
                await downloadImage(url, downloadDir)
                if (++finished % 20 == 0) console.log((finished / images.length * 100).toFixed(2))
            } catch (error) {
                if (error instanceof Error) {
                    errorList.push({
                        url: url,
                        message: error.message
                    })
                }
            }
        })
    })
    await downloadQueue.onIdle()
    writeFileSync('errorList_downAllImage.json', JSON.stringify(errorList))
}

async function pushImagesInContents(images: string[]) {
    const batchSize = 10000
    let offset = 0
    let hasMoreData = true
    while (hasMoreData) {
        const contents = await ContentRepository.find({
            select: { content: true },
            take: batchSize,
            skip: offset,
        })
        if (contents.length === 0) {
            hasMoreData = false
            break
        }
        for (const content of contents) {
            const matches = content.content.matchAll(/<img[^>]*\s+src=["']([^"']+)["']/g)
            for (const match of matches) {
                images.push(match[1])
            }
        }
        offset += batchSize
    }
}

// await firstTask()
// await retryTask()
// await downAllImage()

console.log('[销毁数据源] 开始')
await AppDataSource.destroy()
console.log('[销毁数据源] 结束')