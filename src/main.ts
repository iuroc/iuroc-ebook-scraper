import { AppDataSource, BookRepository, IssueRepository, ReadItemRepository } from './dataSource.js'
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
    const downloadQueue = new PQueue({ concurrency: 20 })
    const errorList: { url: string, message: string }[] = []
    let finished = 0
    const downloadDir = 'D:/BestCode/project/iuroc-ebook-images'
    const images: string[] = []

    // 图书和期刊普通封面
    const result = await ReadItemRepository.find({ select: { cover: true } })
    images.push(...result.map(item => item.cover))

    // 图书大封面
    const result2 = await BookRepository.find({ select: { bigCover: true } })
    images.push(...result2.map(item => item.bigCover))

    // 期刊分期封面
    const result3 = await IssueRepository.find({ select: { cover: true } })
    images.push(...result3.map(item => item.cover))

    images.forEach(url => {
        downloadQueue.add(async () => {
            try {
                await downloadImage(url, downloadDir)
                console.log((++finished / images.length).toFixed(2))
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
}

// firstTask()
// retryTask()

await downAllImage()

console.log('[销毁数据源] 开始')
await AppDataSource.destroy()
console.log('[销毁数据源] 结束')