import { AppDataSource } from './dataSource.js'
import { writeFileSync } from 'fs'
import { saveMagazineData } from './magazine.js'
import { saveBookData } from './book.js'

console.log('[初始化数据源] 开始')
await AppDataSource.initialize()
console.log('[初始化数据源] 结束')

// await saveBookCategory()
// await saveBook()
// await saveMagazineCategory()
// await saveMagazine()
// await saveIssue()

await saveBookData().then(errorList => {
    writeFileSync('errorList_saveBookData.json', JSON.stringify(errorList))
})

// await saveMagazineData().then(errorList => {
//     writeFileSync('errorList_saveMagazineData.json', JSON.stringify(errorList))
// })

console.log('[销毁数据源] 开始')
await AppDataSource.destroy()
console.log('[销毁数据源] 结束')