import {
    ChildEntity,
    Column,
    ManyToOne,
    OneToMany,
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