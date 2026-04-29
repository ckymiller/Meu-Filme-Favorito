import { sql } from "drizzle-orm";
import {
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

import { usersTable } from "./auth";

export const movieStatusEnum = pgEnum("movie_status", [
  "want",
  "watched",
  "abandoned",
]);

export const moviesTable = pgTable(
  "user_movies",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    tmdbId: integer("tmdb_id"),
    titlePtBr: text("title_pt_br").notNull(),
    originalTitle: text("original_title").notNull(),
    year: integer("year"),
    rating: doublePrecision("rating"),
    posterUrl: text("poster_url"),
    status: movieStatusEnum("status").notNull(),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_user_movies_user").on(table.userId),
    uniqueIndex("uniq_user_movies_user_tmdb")
      .on(table.userId, table.tmdbId)
      .where(sql`${table.tmdbId} IS NOT NULL`),
  ],
);

export type UserMovieRow = typeof moviesTable.$inferSelect;
export type InsertUserMovie = typeof moviesTable.$inferInsert;
