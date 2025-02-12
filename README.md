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