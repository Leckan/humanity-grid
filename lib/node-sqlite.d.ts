declare module "node:sqlite" {
  export type SQLiteBindValue = string | number | bigint | null | Uint8Array;
  export class StatementSync {
    all(...values: SQLiteBindValue[]): Record<string, unknown>[];
    get(...values: SQLiteBindValue[]): Record<string, unknown> | undefined;
    run(...values: SQLiteBindValue[]): { changes: number | bigint; lastInsertRowid: number | bigint };
  }
  export class DatabaseSync {
    constructor(path: string, options?: { enableForeignKeyConstraints?: boolean; [key: string]: unknown });
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
