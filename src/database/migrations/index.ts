import {
  addColumns,
  schemaMigrations,
} from "@nozbe/watermelondb/Schema/migrations"

/**
 * WatermelonDB schema migrations.
 *
 * Each migration step moves the database from one schema version to the next.
 * Migrations run automatically when the app detects that the on-device schema
 * version is lower than the current schema version defined in schema.ts.
 */
export default schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        addColumns({
          table: "accounts",
          columns: [{ name: "is_archived", type: "boolean" }],
        }),
      ],
    },
  ],
})
