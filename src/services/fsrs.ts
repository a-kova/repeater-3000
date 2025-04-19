import {
  Card,
  Rating,
  createEmptyCard,
  fsrs,
  generatorParameters,
} from 'ts-fsrs';

const params = generatorParameters({
  enable_fuzz: true,
  enable_short_term: false,
});

const f = fsrs(params);

export function createNewFSRSData() {
  return createEmptyCard(new Date());
}

export function updateFSRSData(card: Card, userRating: Rating): Card {
  const now = new Date();
  const previews = f.repeat(card, now);

  for (const preview of previews) {
    if (preview.log.rating === userRating) {
      return preview.card;
    }
  }

  return card;
}
