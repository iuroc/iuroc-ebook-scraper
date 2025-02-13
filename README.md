# 电子书采集

> 程序编写日期：2025 年 2 月 13 日

## 爬虫流程

1. **配置 MySQL**：编辑 [`dataSource.ts`](src/dataSource.ts)。
2. **首次运行**：取消 [`main.ts`](src/main.ts) 中 `firstTask()` 的注释，执行 `pnpm start`。
3. **检查错误**：如果程序因错误终止，删除所有已创建的表后重新运行 `pnpm start`。
4. **验证结果**：程序结束后，检查 `errorList_saveBookData.json` 和 `errorList_saveMagazineData.json`，如有 EPUB 解析失败记录，继续执行重试操作。
5. **重试任务**：
   - 注释 `firstTask()`，取消 `retryTask()` 的注释。
   - 修改 `retryTask()` 的 `errorList` 文件名，可根据需要调整逻辑（如仅重试 Book 或 Magazine）。
   - 运行 `pnpm start`。
6. **最终检查**：程序结束后，重复步骤 4，确保所有数据正确解析。

## 数据库查询示例

```sql
-- 获取图书分类
SELECT * FROM category WHERE type = 'book';
-- 获取期刊分类
SELECT * FROM category WHERE type = 'magazine';
-- 获取指定分类的图书列表
SELECT * FROM read_item WHERE type = 'book' AND categoryId = 2 LIMIT 20;
-- 获取指定图书的目录
SELECT * FROM catalog WHERE bookId = 4466;
-- 获取指定图书的正文
SELECT * FROM content WHERE bookId = 4466;
```