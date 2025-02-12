import {
    Column,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    TableInheritance,
} from 'typeorm'
import { Issue } from './magazine.js'

@Entity({ comment: '书刊分类' })
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export abstract class Category {
    @PrimaryGeneratedColumn()
    id!: number

    @Column('int')
    @Index()
    chaoxingId!: number

    @Column('varchar')
    type!: 'book' | 'magazine'

    @Column('varchar', { comment: '分类名称' })
    name!: string

    /** 该分类下的书刊列表 */
    abstract items: ReadItem[]
}

@Entity({ comment: '书刊列表' })
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export abstract class ReadItem {
    @PrimaryGeneratedColumn()
    id!: number

    @Column('varchar', { comment: '书刊名称' })
    name!: string

    @Column('varchar')
    surl!: string

    /** 内容介绍 */
    @Column('text', { comment: '内容介绍', nullable: true })
    summary!: string

    /** 普通封面 */
    @Column('varchar', { comment: '普通封面' })
    cover!: string

    @Column('varchar')
    @Index()
    chaoxingId!: string

    /** 该书刊所属的分类 */
    abstract category: Category
}

@Entity({ comment: '书刊目录' })
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export abstract class Catalog {
    @PrimaryGeneratedColumn()
    id!: number

    @Column('int', { comment: '章节起始页码', nullable: true })
    page!: number

    @Column('text', { comment: '章节标题' })
    title!: string

    @Column('int', { comment: '父目录', nullable: true })
    parentId!: number

    @Column('int')
    index!: number

    /** 该目录的子目录列表 */
    abstract childrens: Catalog[]
    /** 该目录的父目录 */
    abstract parent: Catalog
}

@Entity({ comment: '书刊章节内容' })
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export abstract class Content {
    @PrimaryGeneratedColumn()
    id!: number

    @Column('int')
    index!: number

    @Column('longtext')
    content!: string
}