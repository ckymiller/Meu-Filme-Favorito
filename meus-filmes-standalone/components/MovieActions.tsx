import { Alert } from "react-native";

import type { Movie, MovieStatus } from "@/contexts/MoviesContext";

const STATUS_LABELS: Record<MovieStatus, string> = {
  want: "Quero Ver",
  watched: "Já Vi",
  abandoned: "Desisti",
};

type Handlers = {
  updateStatus: (id: string, status: MovieStatus) => Promise<void> | void;
  removeMovie: (id: string) => Promise<void> | void;
};

let handlers: Handlers | null = null;

export function setMovieActionsHandlers(h: Handlers) {
  handlers = h;
}

export function showMovieActions(movie: Movie) {
  if (!handlers) return;
  const h = handlers;
  const others: MovieStatus[] = (
    ["want", "watched", "abandoned"] as MovieStatus[]
  ).filter((s) => s !== movie.status);

  Alert.alert(
    movie.titlePtBr,
    "Escolha uma ação",
    [
      ...others.map((s) => ({
        text: `Mover para “${STATUS_LABELS[s]}”`,
        onPress: () => h.updateStatus(movie.id, s),
      })),
      {
        text: "Remover",
        style: "destructive" as const,
        onPress: () =>
          Alert.alert("Remover filme?", `“${movie.titlePtBr}” será removido.`, [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Remover",
              style: "destructive",
              onPress: () => h.removeMovie(movie.id),
            },
          ]),
      },
      { text: "Cancelar", style: "cancel" as const },
    ],
    { cancelable: true },
  );
}
