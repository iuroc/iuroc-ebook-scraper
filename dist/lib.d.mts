declare abstract class Category {
    id: number;
    chaoxingId: number;
    type: 'book' | 'magazine';
    name: string;
    /** 该分类下的书刊列表 */
    abstract items: ReadItem[];
}
declare abstract class ReadItem {
    id: number;
    name: string;
    surl: string;
    /** 内容介绍 */
    summary: string;
    /** 普通封面 */
    cover: string;
    chaoxingId: string;
    /** 该书刊所属的分类 */
    abstract category: Category;
}
declare abstract class Catalog {
    id: number;
    page: number;
    title: string;
    parentId: number;
    index: number;
    /** 该目录的子目录列表 */
    abstract childrens: Catalog[];
    /** 该目录的父目录 */
    abstract parent: Catalog;
}
declare abstract class Content {
    id: number;
    index: number;
    content: string;
}

declare class MagazineCategory extends Category {
    items: Magazine[];
}
declare class Magazine extends ReadItem {
    /** 国内刊号 */
    cn: string;
    /** 国际刊号 */
    issn: string;
    category: MagazineCategory;
    issues: Issue[];
}
declare class MagazineCatalog extends Catalog {
    childrens: MagazineCatalog[];
    parent: MagazineCatalog;
    issue: Issue;
}
declare class Issue {
    id: number;
    issueId: string;
    name: string;
    cover: string;
    magazine: Magazine;
    surl: string;
    webReader: string;
    index: number;
    contents: MagazineContent[];
    catalogs: MagazineCatalog[];
}
declare class MagazineContent extends Content {
    issue: Issue;
}

declare const entities: (typeof Catalog | typeof Category | typeof ReadItem | typeof Content | typeof Issue)[];

export { entities };
