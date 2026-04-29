import React from "react";

import { MovieList } from "@/components/MovieList";

export default function AbandonedScreen() {
  return (
    <MovieList
      status="abandoned"
      emptyMessage="Filmes que você começou e decidiu não terminar ficam aqui."
    />
  );
}
