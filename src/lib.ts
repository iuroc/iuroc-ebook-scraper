
import { Catalog, Category, Content, ReadItem } from './entity/common.js'
import { Book, BookCatalog, BookCategory, BookContent } from './entity/book.js'
import { Issue, Magazine, MagazineCatalog, MagazineCategory, MagazineContent } from './entity/magazine.js'

export const entities = [
    Catalog, Category, ReadItem, Content,
    Book, BookCategory, BookCatalog, BookContent,
    Magazine, MagazineCategory, MagazineCatalog, Issue, MagazineContent
]

export {
    Catalog, Category, ReadItem, Content,
    Book, BookCategory, BookCatalog, BookContent,
    Magazine, MagazineCategory, MagazineCatalog, Issue, MagazineContent
}