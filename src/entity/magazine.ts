import {
    ChildEntity,
    Column,
    Entity,
    Index,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm'
import { Catalog, Category, Content, ReadItem } from './common.js'

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

    @ManyToOne(() => MagazineCategory, category => category.items, { onDelete: 'CASCADE' })
    category!: MagazineCategory

    @OneToMany(() => Issue, issue => issue.magazine)
    issues!: Issue[]
}

@ChildEntity('magazine')
export class MagazineCatalog extends Catalog {
    @OneToMany(() => MagazineCatalog, catalog => catalog.parent)
    childrens!: MagazineCatalog[]

    @ManyToOne(() => MagazineCatalog, catalog => catalog.childrens, { onDelete: 'CASCADE' })
    parent!: MagazineCatalog

    @ManyToOne(() => Issue, issue => issue.catalogs, { onDelete: 'CASCADE' })
    issue!: Issue
}

@Entity({ comment: '期刊分期列表' })
export class Issue {
    @PrimaryGeneratedColumn()
    id!: number

    @Column('varchar')
    @Index()
    issueId!: string

    @Column('varchar', { comment: '分期标题' })
    name!: string

    @Column('varchar', { comment: '分期封面' })
    cover!: string

    @ManyToOne(() => Magazine, magazine => magazine.issues, { onDelete: 'CASCADE' })
    magazine!: Magazine

    @Column('varchar')
    surl!: string

    @Column('varchar', { comment: '阅读器网页' })
    webReader!: string

    @Column('int')
    index!: number

    @OneToMany(() => MagazineContent, content => content.issue)
    contents!: MagazineContent[]

    @OneToMany(() => MagazineCatalog, catalog => catalog.issue)
    catalogs!: MagazineCatalog[]
}

@ChildEntity('magazine')
export class MagazineContent extends Content {
    @ManyToOne(() => Issue, issue => issue.contents, { onDelete: 'CASCADE' })
    issue!: Issue
}