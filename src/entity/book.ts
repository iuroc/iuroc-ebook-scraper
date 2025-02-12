import {
    ChildEntity,
    Column,
    Index,
    ManyToOne,
    OneToMany,
} from 'typeorm'
import { BookItem } from 'gede-book-api'
import { Catalog, Category, Content, ReadItem } from './common.js'

@ChildEntity('book')
export class BookCategory extends Category {
    @OneToMany(() => Book, magazine => magazine.category)
    items!: Book[]
}

@ChildEntity('book')
export class Book extends ReadItem {
    @Column('varchar', { comment: '图书作者' })
    @Index()
    author!: string

    /** 出版社名称 */
    @Column('varchar', { comment: '出版社名称' })
    publish!: string

    /** 大尺寸封面 */
    @Column('varchar', { comment: '大尺寸封面' })
    bigCover!: string

    /** 图书专属，阅读器网页链接 */
    @Column('varchar', { comment: '阅读器网页' })
    webReader!: string

    /** 图书专属，图书资源类型 */
    @Column('varchar', { comment: '资源类型' })
    idType!: BookItem['type']

    /** 图书专属 */
    @Column('varchar')
    isbn!: string

    @ManyToOne(() => BookCategory, category => category.items, { onDelete: 'CASCADE' })
    category!: BookCategory

    @OneToMany(() => BookCatalog, catalog => catalog.book)
    catalogs!: BookCatalog[]

    @OneToMany(() => BookContent, content => content.book)
    contents!: BookContent[]
}

@ChildEntity('book')
export class BookCatalog extends Catalog {
    @OneToMany(() => BookCatalog, catalog => catalog.parent)
    childrens!: BookCatalog[]

    @ManyToOne(() => BookCatalog, catalog => catalog.childrens, { onDelete: 'CASCADE' })
    parent!: BookCatalog

    @ManyToOne(() => Book, item => item.catalogs, { onDelete: 'CASCADE' })
    book!: Book
}

@ChildEntity('book')
export class BookContent extends Content {
    @ManyToOne(() => Book, book => book.contents, { onDelete: 'CASCADE' })
    book!: Book
}