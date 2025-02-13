import { DataSource } from 'typeorm'
import { Catalog, Category, Content, ReadItem } from './entity/common.js'
import { Book, BookCatalog, BookCategory, BookContent } from './entity/book.js'
import { Issue, Magazine, MagazineCatalog, MagazineCategory, MagazineContent } from './entity/magazine.js'

export const AppDataSource = new DataSource({
    type: 'mysql',
    host: '127.0.0.1',
    port: 3306,
    username: 'root',
    password: '12345678',
    synchronize: true,
    database: 'iuroc_ebook_test',
    entities: [
        Catalog, Category, ReadItem, Content,
        Book, BookCategory, BookCatalog, BookContent,
        Magazine, MagazineCategory, MagazineCatalog, Issue, MagazineContent,
    ]
})

export const BookCategoryRepository = AppDataSource.getRepository(BookCategory)
export const MagazineCategoryRepository = AppDataSource.getRepository(MagazineCategory)
export const CategoryRepository = AppDataSource.getRepository(Category)
export const BookRepository = AppDataSource.getRepository(Book)
export const MagazineRepository = AppDataSource.getRepository(Magazine)
export const ReadItemRepository = AppDataSource.getRepository(ReadItem)
export const IssueRepository = AppDataSource.getRepository(Issue)
export const BookContentRepository = AppDataSource.getRepository(BookContent)
export const MagazineContentRepository = AppDataSource.getRepository(MagazineContent)
export const BookCatalogRepository = AppDataSource.getRepository(BookCatalog)
export const MagazineCatalogRepository = AppDataSource.getRepository(MagazineCatalog)
export const CatalogRepository = AppDataSource.getRepository(Catalog)