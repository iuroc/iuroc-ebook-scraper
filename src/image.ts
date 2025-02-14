import crypto from 'crypto'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

/** 下载图片，并根据输入的 URL 编码文件名 */
export async function download(url: string, dir: string) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    const filename = crypto.createHash('sha1').update(url).digest('hex') + '.jpg'
    const filepath = join(dir, filename)
    if (existsSync(filepath)) {
        // console.log(`${filepath} 已存在，跳过下载`)
        return
    }
    const arrayBuffer = await fetch(url).then(res => res.arrayBuffer())
    writeFileSync(filepath, Buffer.from(arrayBuffer))
}