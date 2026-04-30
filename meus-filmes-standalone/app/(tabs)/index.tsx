import React from "react";

import { MovieList } from "@/components/MovieList";

export default function WantToWatchScreen() {
  return (
    <MovieList
      status="want"
      emptyMessage="Toque no botão + para adicionar filmes que você quer assistir."
    />
  );
}
