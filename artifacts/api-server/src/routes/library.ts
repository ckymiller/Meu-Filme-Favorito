import { Router, type IRouter } from "express";
import { db, moviesTable, type InsertUserMovie } from "@workspace/db";
import { and, eq, sql } from "drizzle-orm";
import {
  AddMyMovieBody,
  BulkUpsertMyMoviesBody,
  ListMyMoviesResponseItem,
  UpdateMyMovieBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serialize(row: typeof moviesTable.$inferSelect) {
  return ListMyMoviesResponseItem.parse({
    id: row.id,
    tmdbId: row.tmdbId,
    titlePtBr: row.titlePtBr,
    originalTitle: row.originalTitle,
    year: row.year,
    rating: row.rating,
    posterUrl: row.posterUrl,
    status: row.status,
    addedAt: row.addedAt.toISOString(),
  });
}

router.get("/me/movies", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const rows = await db
    .select()
    .from(moviesTable)
    .where(eq(moviesTable.userId, req.user.id));
  res.json(rows.map(serialize));
});

router.post("/me/movies", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = AddMyMovieBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const data = parsed.data;

  if (data.tmdbId != null) {
    const [existing] = await db
      .select()
      .from(moviesTable)
      .where(
        and(
          eq(moviesTable.userId, req.user.id),
          eq(moviesTable.tmdbId, data.tmdbId),
        ),
      );
    if (existing) {
      const [updated] = await db
        .update(moviesTable)
        .set({ status: data.status })
        .where(eq(moviesTable.id, existing.id))
        .returning();
      res.json(serialize(updated));
      return;
    }
  }

  const insertRow: InsertUserMovie = {
    userId: req.user.id,
    tmdbId: data.tmdbId ?? null,
    titlePtBr: data.titlePtBr,
    originalTitle: data.originalTitle ?? data.titlePtBr,
    year: data.year ?? null,
    rating: data.rating ?? null,
    posterUrl: data.posterUrl ?? null,
    status: data.status,
  };
  const [row] = await db.insert(moviesTable).values(insertRow).returning();
  res.json(serialize(row));
});

router.post("/me/movies/bulk", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = BulkUpsertMyMoviesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  for (const data of parsed.data.movies) {
    if (data.tmdbId != null) {
      const [existing] = await db
        .select()
        .from(moviesTable)
        .where(
          and(
            eq(moviesTable.userId, req.user.id),
            eq(moviesTable.tmdbId, data.tmdbId),
          ),
        );
      if (existing) continue;
    }
    await db.insert(moviesTable).values({
      userId: req.user.id,
      tmdbId: data.tmdbId ?? null,
      titlePtBr: data.titlePtBr,
      originalTitle: data.originalTitle ?? data.titlePtBr,
      year: data.year ?? null,
      rating: data.rating ?? null,
      posterUrl: data.posterUrl ?? null,
      status: data.status,
    });
  }

  const rows = await db
    .select()
    .from(moviesTable)
    .where(eq(moviesTable.userId, req.user.id));
  res.json(rows.map(serialize));
});

router.patch("/me/movies/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = UpdateMyMovieBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const [row] = await db
    .update(moviesTable)
    .set({ status: parsed.data.status })
    .where(
      and(eq(moviesTable.userId, req.user.id), eq(moviesTable.id, req.params.id)),
    )
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serialize(row));
});

router.delete("/me/movies/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const result = await db
    .delete(moviesTable)
    .where(
      and(eq(moviesTable.userId, req.user.id), eq(moviesTable.id, req.params.id)),
    )
    .returning({ id: moviesTable.id });
  if (result.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ success: true });
});

export default router;

void sql;
