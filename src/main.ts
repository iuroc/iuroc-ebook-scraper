import { AppDataSource } from './dataSource.js'
import { readFileSync, writeFileSync } from 'fs'
import { saveIssue, saveMagazine, saveMagazineCategory, saveMagazineData } from './magazine.js'
import { saveBook, saveBookCategory, saveBookData } from './book.js'
import { Issue } from './entity/magazine.js'

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

// firstTask()
// retryTask()

console.log('[销毁数据源] 开始')
await AppDataSource.destroy()
console.log('[销毁数据源] 结束')