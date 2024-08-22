export interface ISelect {
    table: string
    fields: string[]
    condition?: string
    join?: IJoin[]
    order?: string
}

export interface IJoin {
    type: 'INNER JOIN' | 'LEFT JOIN',
    table: string,
    firstId: string,
    secondId: string
}

export interface IInsert {
    table: string,
    fields: string[],
    values: any[],
    returns?: string[]
}

export interface IDelete {
    table: string,
    condition: string
}

export interface IUpdate {
    table: string,
    set: string[],
    condition: string,
    returns?: string[]
}