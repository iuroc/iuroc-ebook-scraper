import {
    ChildEntity,
    Column,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm'
import { Catalog, Category, ReadItem } from './common.js'

@ChildEntity('magazine')
export class MagazineCategory extends Category {
    @OneToMany(() => Magazine, magazine => magazine.category)
    items!: Magazine[]
}

@ChildEntity('magazine')
export class Magazine extends ReadItem {
    /** 国内刊号 */
    @Column('varchar', { comment: '国内刊号' })
    cn!: string

    /** 国际刊号 */
    @Column('varchar', { comment: '国际刊号' })
    issn!: string

    @ManyToOne(() => MagazineCategory, category => category.items)
    category!: MagazineCategory

    @OneToMany(() => MagazineCatalog, catalog => catalog.item)
    catalogs!: MagazineCatalog[]

    @OneToMany(() => Issue, issue => issue.magazine)
    issues!: Issue[]
}

@ChildEntity('magazine')
export class MagazineCatalog extends Catalog {
    @OneToMany(() => MagazineCatalog, catalog => catalog.parent)
    childrens!: MagazineCatalog[]

    @ManyToOne(() => MagazineCatalog, catalog => catalog.childrens)
    parent!: MagazineCatalog

    @ManyToOne(() => Magazine, item => item.catalogs)
    item!: Magazine
}

@Entity()
export class Issue {
    @PrimaryGeneratedColumn()
    id!: number

    @Column('varchar')
    issueId!: string

    @Column('varchar', { name: '分期标题' })
    name!: string

    @Column('varchar', { name: '分期封面' })
    cover!: string

    @ManyToOne(() => Magazine, magazine => magazine.issues)
    magazine!: Magazine

    @Column('varchar')
    surl!: string

    @Column('varchar', { comment: '阅读器网页' })
    webReader!: string

    @Column('int')
    index!: number
}