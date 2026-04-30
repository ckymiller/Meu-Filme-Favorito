import React from "react";

import { MovieList } from "@/components/MovieList";

export default function WatchedScreen() {
  return (
    <MovieList
      status="watched"
      emptyMessage="Os filmes que você já viu aparecem aqui em ordem alfabética."
    />
  );
}
