import { DataSource } from 'typeorm'
import { Catalog, Category, ReadItem } from './entity/common.js'
import { Book, BookCatalog, BookCategory } from './entity/book.js'
import { Issue, Magazine, MagazineCatalog, MagazineCategory } from './entity/magazine.js'

export const AppDataSource = new DataSource({
    type: 'mysql',
    host: '127.0.0.1',
    port: 3306,
    username: 'root',
    password: '12345678',
    synchronize: true,
    database: 'iuroc_ebook',
    entities: [
        Catalog, Category, ReadItem,
        Book, BookCategory, BookCatalog,
        Magazine, MagazineCategory, MagazineCatalog, Issue
    ]
})
export const BookCategoryRepository = AppDataSource.getRepository(BookCategory)
export const MagazineCategoryRepository = AppDataSource.getRepository(MagazineCategory)
export const CategoryRepository = AppDataSource.getRepository(Category)
export const BookRepository = AppDataSource.getRepository(Book)
export const MagazineRepository = AppDataSource.getRepository(Magazine)
export const ReadItemRepository = AppDataSource.getRepository(ReadItem)
export const IssueRepository = AppDataSource.getRepository(Issue)